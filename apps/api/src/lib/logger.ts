import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    process.env.NODE_ENV === 'production' ? format.json() : format.prettyPrint(),
  ),
  transports: [new transports.Console()],
  // NOTE: never log raw clinical content, SA IDs or patient identifiers.
});
