import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const env = process.env.NODE_ENV;
const isDev = env === 'development';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'sumviet-api' + env },
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    new DailyRotateFile({
      filename: 'sumviet-api-%DATE%.log',
      maxSize: '20m',
      maxFiles: '30d',
      dirname: 'logs'
    }),
    new DailyRotateFile({
      level: 'error',
      filename: 'error-%DATE%.log',
      maxSize: '20m',
      maxFiles: '20d',
      dirname: 'logs/errors'
    })
  ]
});

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
// if (process.env.NODE_ENV !== 'production') {

const prettyFormat = winston.format.printf(({ level, message, label, timestamp, stack }) => {
  return `${timestamp} ${label ? `[${label}]` : ''}| ${level}: ${message && message} ${
    stack && isDev ? JSON.stringify(stack, null, 2) : ''
  }`;
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize({ all: true }), prettyFormat)
    })
  );
}

export default logger;
