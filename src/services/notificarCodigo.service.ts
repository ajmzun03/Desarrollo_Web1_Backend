import { sendSMS } from './sendSMS.js'
import { sendEmail } from './sendMail.js'
import { APP_NAME, OTP_CANALES_AMBOS, OTP_EN_LOG } from '../config.js'
import logger from '../config/logger.js'

export interface DestinoCodigo {
  telefono?: string | null
  correo?: string | null
}

function asunto(contexto: 'login' | 'reset'): string {
  return contexto === 'login'
    ? `Tu código de verificación — ${APP_NAME}`
    : `Tu código para recuperar la contraseña — ${APP_NAME}`
}

function plantillaHTML(codigo: string, contexto: 'login' | 'reset'): string {
  const titulo = contexto === 'login' ? 'Código de verificación' : 'Recuperación de contraseña'
  const instruccion = contexto === 'login'
    ? 'Ingresa este código para completar tu inicio de sesión.'
    : 'Ingresa este código para restablecer tu contraseña.'
  return `
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
    <h2 style="color: #333;">${titulo}</h2>
    <p style="color: #555;">${instruccion}</p>
    <p style="font-size: 32px; letter-spacing: 8px; font-weight: bold; text-align: center;
              background: #f4f4f4; padding: 16px; border-radius: 8px;">${codigo}</p>
    <p style="color: #999; font-size: 13px;">Este código es válido por 5 minutos. Si no solicitaste este mensaje, ignora este correo.</p>
    <p style="color: #999; font-size: 12px;">— ${APP_NAME}</p>
  </div>`
}

/**
 * Envía el código de verificación por SMS; si no hay teléfono o el SMS
 * falla, hace fallback a correo. Con OTP_ENVIAR_AMBOS=true lo envía por los dos canales.
 * Devuelve el canal usado ('sms' | 'email' | 'ambos') o null si todos fallan.
 */
export async function enviarCodigo(
  destino: DestinoCodigo,
  codigo: string,
  contexto: 'login' | 'reset'
): Promise<'sms' | 'email' | 'ambos' | 'log' | null> {
  // Solo desarrollo: deja el código en el log para poder probar sin que SMS/correo funcionen
  if (OTP_EN_LOG) {
    logger.warn({ contexto, codigo }, 'OTP (solo desarrollo, OTP_MOSTRAR_EN_LOG=true)')
  }
  const canal = await enviarPorCanales(destino, codigo, contexto)
  return canal ?? (OTP_EN_LOG ? 'log' : null)
}

async function enviarPorCanales(
  destino: DestinoCodigo,
  codigo: string,
  contexto: 'login' | 'reset'
): Promise<'sms' | 'email' | 'ambos' | null> {
  if (OTP_CANALES_AMBOS && destino.telefono && destino.correo) {
    const [sms, correo] = await Promise.all([
      sendSMS({ phoneNumber: destino.telefono, code: codigo }),
      sendEmail(destino.correo, asunto(contexto), plantillaHTML(codigo, contexto))
    ])
    logger.info({ contexto, sms, correo }, 'Código OTP enviado por SMS y correo')
    if (sms && correo) return 'ambos'
    if (sms) return 'sms'
    if (correo) return 'email'
    logger.error({ contexto }, 'No se pudo enviar el código por ningún canal')
    return null
  }

  if (destino.telefono) {
    const enviado = await sendSMS({ phoneNumber: destino.telefono, code: codigo })
    if (enviado) {
      logger.info({ contexto, canal: 'sms' }, 'Código OTP enviado por SMS')
      return 'sms'
    }
    logger.warn({ contexto }, 'SMS falló, intentando fallback por correo')
  }

  if (!destino.correo) {
    logger.error({ contexto, telefono: destino.telefono }, 'Sin correo registrado: no se pudo enviar el código')
    return null
  }
  const enviado = await sendEmail(destino.correo, asunto(contexto), plantillaHTML(codigo, contexto))
  if (enviado) {
    logger.info({ contexto, canal: 'email' }, 'Código OTP enviado por correo')
    return 'email'
  }

  logger.error({ contexto, correo: destino.correo }, 'No se pudo enviar el código por ningún canal')
  return null
}
