import { Vonage } from '@vonage/server-sdk'
import { Auth } from '@vonage/auth'
import { SMS, SMS_SECRET, APP_NAME } from '../config.js'
import logger from '../config/logger.js'

interface Props {
  to: string,
  from: string,
  text: string
}

interface SMSProps {
  phoneNumber: string,
  code: string
}

const auth = new Auth({
  apiKey: SMS,
  apiSecret: SMS_SECRET
})

const vonage = new Vonage(auth)

async function send({ to, from, text }: Props): Promise<boolean> {
  try {
    await vonage.sms.send({ to, from, text })
    return true
  } catch (error) {
    logger.error(error, 'Error enviando el mensaje SMS')
    return false
  }
}

/**
 * Envía un SMS con un código de verificación a un número de Guatemala (502).
 * Devuelve true si se envió, false si falló. No lanza excepciones.
 */
export async function sendSMS({ phoneNumber, code }: SMSProps): Promise<boolean> {
  const from = APP_NAME
  const to = `502${phoneNumber}`
  const text = `Tu código de verificación para ${APP_NAME} es: ${code}. Válido por 5 minutos.`
  return send({ to, from, text })
}
