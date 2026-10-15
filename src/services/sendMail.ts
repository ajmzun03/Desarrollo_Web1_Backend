import nodemailer from 'nodemailer'
import { SMTP_HOST, SMTP_PORT, SMTP_FROM, SMTP_USER, SMTP_PASS } from '../config.js'
import logger from '../config/logger.js'

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465,
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  tls: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2'
  }
})

/**
 * Envía un correo HTML. Devuelve true si se envió, false si falló.
 * No lanza excepciones: el llamador decide el fallback.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const info = await transporter.sendMail({ from: SMTP_FROM, to, subject, html })
    logger.info({ messageId: info.messageId, to }, 'Correo enviado')
    if (info.rejected.length > 0) {
      logger.warn({ rejected: info.rejected, to }, 'Correos rechazados por el servidor')
    }
    return true
  } catch (err: any) {
    switch (err.code) {
      case 'ECONNECTION':
      case 'ETIMEDOUT':
        logger.warn({ err: err.message, to }, 'Error de red al enviar correo')
        break
      case 'EAUTH':
        logger.error({ err: err.message, to }, 'Autenticación SMTP fallida')
        break
      case 'EENVELOPE':
        logger.error({ err: err.message, rejected: err.rejected || [], to }, 'Envelope inválido al enviar correo')
        break
      default:
        logger.error({ err: err.message, to }, 'Error al enviar correo')
    }
    return false
  }
}
