import pino from 'pino';
const transport = pino.transport({
    target: 'pino/file',
    options: {
        destination: './logs/app.log'
    }
});
const logger = pino(transport);
export default logger;
//# sourceMappingURL=logger.js.map