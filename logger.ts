import { createLogger as winstonCreateLogger, format, transports } from 'winston';

const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';

export function createLogger(module: string) {
  return winstonCreateLogger({
    level: LOG_LEVEL,
    format: format.combine(
      format.timestamp({ format: 'HH:mm:ss' }),
      format.colorize(),
      format.printf(({ timestamp, level, message, ...rest }) => {
        const extras = Object.keys(rest).length
          ? ' ' + JSON.stringify(rest)
          : '';
        return `${timestamp} [${module}] ${level}: ${message}${extras}`;
      })
    ),
    transports: [
      new transports.Console(),
      new transports.File({
        filename: 'logs/agent.log',
        format: format.combine(
          format.timestamp(),
          format.uncolorize(),
          format.json()
        ),
      }),
    ],
  });
}
