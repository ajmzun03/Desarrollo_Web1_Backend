import pino from 'pino'

// En contenedores / PaaS (Render, etc.) el disco es efímero: los logs deben ir a stdout.
// El archivo ./logs/app.log se mantiene solo fuera de producción (o con LOG_TO_FILE=true).
const aArchivo = process.env.NODE_ENV !== 'production' || process.env.LOG_TO_FILE === 'true'

const targets: pino.TransportTargetOptions[] = [
  { target: 'pino/file', options: { destination: 1 } } // 1 = stdout
]
if (aArchivo) {
  targets.push({ target: 'pino/file', options: { destination: './logs/app.log', mkdir: true } })
}

const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? 'info',
    // Nunca registrar credenciales aunque se loguee un objeto de request/usuario completo
    redact: ['*.contrasenia', '*.password', '*.nuevaContrasenia', 'req.headers.authorization']
  },
  pino.transport({ targets })
)

export default logger
