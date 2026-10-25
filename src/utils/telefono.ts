/**
 * Normaliza un teléfono al formato internacional que espera Vonage (solo dígitos, con código de país).
 * - 8 dígitos  => número local de Guatemala: se antepone 502.
 * - 502 + 8 dígitos (11 dígitos) => ya trae el código: se deja igual (evita el 502502... duplicado).
 * - Otro largo => se asume que ya es internacional y se deja con solo dígitos.
 * Devuelve null si no hay dígitos suficientes.
 */
export function normalizarTelefonoGT(telefono: string | null | undefined): string | null {
  const digitos = String(telefono ?? '').replace(/\D/g, '');
  if (digitos.length < 8) return null;
  if (digitos.length === 8) return '502' + digitos;
  return digitos;
}
