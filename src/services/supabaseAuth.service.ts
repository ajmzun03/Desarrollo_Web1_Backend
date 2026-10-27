import { createClient, type EmailOtpType, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY } from '../config.js'
import logger from '../config/logger.js'

/**
 * Único módulo que habla con Supabase Auth.
 *
 * Supabase se usa SOLO para dos cosas: el segundo factor (TOTP) del personal y el correo de
 * recuperación de contraseña. Las contraseñas (bcrypt) y los JWT de sesión siguen siendo de COPAC.
 * La sesión de Supabase nunca sale del servidor.
 */

export type CodigoErrorSupabase =
  | 'no_configurado'
  | 'codigo_invalido'
  | 'enlace_invalido'
  | 'sesion_invalida'
  | 'limite'
  | 'servicio'

export class SupabaseAuthError extends Error {
  constructor(message: string, public readonly codigo: CodigoErrorSupabase) {
    super(message)
    this.name = 'SupabaseAuthError'
  }
}

/** Sesión intermedia de Supabase (nivel aal1) guardada en el servidor entre el login y el código. */
export interface SesionSupabase {
  accessToken: string
  refreshToken: string
}

export interface EnrolamientoTotp {
  factorId: string
  qrCode: string
  secret: string
  uri: string
}

export function supabaseConfigurado(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY && SUPABASE_SECRET_KEY)
}

const OPCIONES = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }

function crear(clave: string): SupabaseClient {
  if (!supabaseConfigurado()) {
    throw new SupabaseAuthError('Supabase Auth no está configurado', 'no_configurado')
  }
  return createClient(SUPABASE_URL, clave, OPCIONES)
}

const admin = () => crear(SUPABASE_SECRET_KEY)
const publico = () => crear(SUPABASE_PUBLISHABLE_KEY)

/** Traduce un error del SDK a un SupabaseAuthError con un código estable. */
function traducir(err: unknown, porDefecto: CodigoErrorSupabase = 'servicio'): SupabaseAuthError {
  if (err instanceof SupabaseAuthError) return err
  const e = err as { message?: string; status?: number; code?: string }
  if (e.status === 429 || e.code === 'over_request_rate_limit' || e.code === 'over_email_send_rate_limit') {
    return new SupabaseAuthError('Demasiadas solicitudes a Supabase Auth', 'limite')
  }
  logger.warn({ status: e.status, code: e.code }, 'Error de Supabase Auth')
  return new SupabaseAuthError(e.message ?? 'Error de Supabase Auth', porDefecto)
}

/** Cliente de usuario con la sesión intermedia ya cargada. */
async function conSesion(sesion: SesionSupabase): Promise<SupabaseClient> {
  const cliente = publico()
  const { error } = await cliente.auth.setSession({ access_token: sesion.accessToken, refresh_token: sesion.refreshToken })
  if (error) {
    const e = error as { code?: string; message?: string }
    if (/session|refresh_token/i.test(`${e.code ?? ''} ${e.message ?? ''}`)) {
      throw new SupabaseAuthError('La sesión de verificación venció', 'sesion_invalida')
    }
    throw traducir(error)
  }
  return cliente
}

/**
 * Abre una sesión aal1 para el correo SIN contraseña de Supabase: la contraseña ya fue validada
 * (bcrypt) por COPAC. generateLink crea el usuario en Supabase si aún no existe y no envía correo;
 * verificar su token devuelve la sesión.
 */
export async function abrirSesion(correo: string): Promise<SesionSupabase> {
  try {
    const { data, error } = await admin().auth.admin.generateLink({ type: 'magiclink', email: correo })
    if (error || !data?.properties?.hashed_token) throw error ?? new Error('generateLink sin token')

    // Para un usuario que aún no existe, Supabase lo crea y genera un enlace de tipo "signup" (no "magiclink"):
    // se canjea con el tipo que informa la propia respuesta.
    const tipo = (data.properties.verification_type ?? 'magiclink') as EmailOtpType
    const { data: sesion, error: errorVerificar } = await publico().auth.verifyOtp({
      token_hash: data.properties.hashed_token,
      type: tipo
    })
    if (errorVerificar || !sesion.session) throw errorVerificar ?? new Error('verifyOtp sin sesión')

    return { accessToken: sesion.session.access_token, refreshToken: sesion.session.refresh_token }
  } catch (err) {
    throw traducir(err)
  }
}

/** Devuelve el id del factor TOTP verificado del usuario, o null si debe enrolar uno. */
export async function factorVerificado(sesion: SesionSupabase): Promise<string | null> {
  try {
    const cliente = await conSesion(sesion)
    const { data, error } = await cliente.auth.mfa.listFactors()
    if (error) throw error
    return data.totp.find(f => f.status === 'verified')?.id ?? null
  } catch (err) {
    throw traducir(err)
  }
}

/**
 * Crea un factor TOTP nuevo y devuelve el QR. Antes elimina factores sin verificar que hayan
 * quedado de un intento anterior (Supabase no permite dos factores con el mismo nombre).
 */
export async function enrolarTotp(sesion: SesionSupabase): Promise<EnrolamientoTotp> {
  try {
    const cliente = await conSesion(sesion)
    const { data: factores, error: errorListar } = await cliente.auth.mfa.listFactors()
    if (errorListar) throw errorListar
    for (const f of factores.all.filter(f => f.factor_type === 'totp' && f.status !== 'verified')) {
      await cliente.auth.mfa.unenroll({ factorId: f.id })
    }

    const { data, error } = await cliente.auth.mfa.enroll({ factorType: 'totp', friendlyName: `COPAC-${Date.now()}` })
    if (error || !data) throw error ?? new Error('enroll sin datos')
    return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret, uri: data.totp.uri }
  } catch (err) {
    throw traducir(err)
  }
}

/**
 * Valida el código de 6 dígitos. Si es correcto, Supabase eleva la sesión a aal2 (y, si el factor
 * estaba sin verificar, lo verifica) y la sesión se cierra (solo esa: scope "local"). Si es incorrecto la
 * sesión se conserva para que el usuario pueda reintentar; el tope de intentos lo aplica el controlador.
 */
export async function verificarCodigoTotp(sesion: SesionSupabase, factorId: string, codigo: string): Promise<void> {
  const cliente = await conSesion(sesion).catch(err => { throw traducir(err) })
  try {
    const { error } = await cliente.auth.mfa.challengeAndVerify({ factorId, code: codigo })
    if (error) {
      const e = error as { status?: number; code?: string }
      if (e.status === 429 || e.code === 'over_request_rate_limit') throw traducir(error)
      throw new SupabaseAuthError('Código incorrecto', 'codigo_invalido')
    }
    const { data: nivel, error: errorNivel } = await cliente.auth.mfa.getAuthenticatorAssuranceLevel()
    if (errorNivel || nivel?.currentLevel !== 'aal2') {
      throw new SupabaseAuthError('La sesión no alcanzó el nivel aal2', 'codigo_invalido')
    }
  } catch (err) {
    throw traducir(err)
  }
  // Código correcto: la sesión de Supabase ya cumplió su función.
  await cliente.auth.signOut({ scope: 'local' }).catch(() => undefined)
}

/** Cierra la sesión intermedia (código agotado, sesión abandonada). Nunca lanza. */
export async function cerrarSesion(sesion: SesionSupabase): Promise<void> {
  try {
    await admin().auth.admin.signOut(sesion.accessToken, 'local')
  } catch {
    // La sesión intermedia vence sola; no es crítico.
  }
}

/** Elimina todos los factores TOTP del correo (para quien perdió su teléfono). Devuelve cuántos eliminó. */
export async function reiniciarMfa(correo: string): Promise<number> {
  try {
    const cliente = admin()
    const { data: enlace, error } = await cliente.auth.admin.generateLink({ type: 'magiclink', email: correo })
    if (error || !enlace?.user) throw error ?? new Error('generateLink sin usuario')
    const userId = enlace.user.id

    const { data, error: errorListar } = await cliente.auth.admin.mfa.listFactors({ userId })
    if (errorListar) throw errorListar
    let eliminados = 0
    for (const f of data.factors) {
      const { error: errorBorrar } = await cliente.auth.admin.mfa.deleteFactor({ id: f.id, userId })
      if (errorBorrar) throw errorBorrar
      eliminados++
    }
    return eliminados
  } catch (err) {
    throw traducir(err)
  }
}

/**
 * Envía el correo de recuperación (plantilla "Reset Password" de Supabase, con SMTP propio).
 * Asegura que el usuario exista en Supabase: si nunca inició sesión, resetPasswordForEmail no enviaría nada.
 */
export async function enviarCorreoRecuperacion(correo: string, redirectTo: string): Promise<void> {
  try {
    const { error: errorCrear } = await admin().auth.admin.createUser({ email: correo, email_confirm: true })
    if (errorCrear && errorCrear.code !== 'email_exists' && errorCrear.status !== 422) throw errorCrear

    const { error } = await publico().auth.resetPasswordForEmail(correo, redirectTo ? { redirectTo } : undefined)
    if (error) throw error
  } catch (err) {
    throw traducir(err)
  }
}

/**
 * Valida el token_hash del enlace del correo (de un solo uso) y devuelve el correo verificado.
 * Quien lo presenta demostró controlar ese correo.
 */
export async function verificarEnlaceRecuperacion(tokenHash: string): Promise<string> {
  const cliente = publico()
  try {
    const { data, error } = await cliente.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
    const correo = data?.user?.email
    if (error || !correo) throw new SupabaseAuthError('Enlace inválido, vencido o ya usado', 'enlace_invalido')
    return correo.toLowerCase()
  } catch (err) {
    if (err instanceof SupabaseAuthError) throw err
    const e = err as { status?: number }
    throw traducir(err, e.status && e.status >= 500 ? 'servicio' : 'enlace_invalido')
  } finally {
    await cliente.auth.signOut({ scope: 'local' }).catch(() => undefined)
  }
}
