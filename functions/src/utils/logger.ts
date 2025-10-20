import * as functions from 'firebase-functions';
import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'coloring-platform-functions' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});

// Cloud Functions 로거와 통합
export const createFunctionLogger = (functionName: string) => {
  return {
    info: (message: string, meta?: any) => {
      logger.info(message, { functionName, ...meta });
      functions.logger.info(message, meta);
    },
    error: (message: string, meta?: any) => {
      logger.error(message, { functionName, ...meta });
      functions.logger.error(message, meta);
    },
    warn: (message: string, meta?: any) => {
      logger.warn(message, { functionName, ...meta });
      functions.logger.warn(message, meta);
    },
    debug: (message: string, meta?: any) => {
      logger.debug(message, { functionName, ...meta });
      functions.logger.debug(message, meta);
    },
  };
};

export { logger };
