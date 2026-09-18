import pino from 'pino'
import fs from 'fs';

fs.mkdirSync('./logs', { recursive: true });

const transport = pino.transport({
  target: 'pino/file',
  options: {
    destination: './logs/app.log'
  }
})

const logger = pino(transport)

export default logger