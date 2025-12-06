import config from './config';

export interface LoggingConfig {
  level: string;
  enableFileLogging: boolean;
  enableConsoleLogging: boolean;
  logDirectory: string;
  maxFileSize: string;
  maxFiles: string;
  enableRotation: boolean;
  enableStructuredLogging: boolean;
  enableRequestLogging: boolean;
  enableErrorTracking: boolean;
}

export const loggingConfig: LoggingConfig = {
  level: config.env === 'development' ? 'debug' : 'info',
  enableFileLogging: true,
  enableConsoleLogging: true,
  logDirectory: process.env.LOGS_DIR || './logs',
  maxFileSize: '20m',
  maxFiles: '14d',
  enableRotation: true,
  enableStructuredLogging: config.env === 'production',
  enableRequestLogging: true,
  enableErrorTracking: true,
};

// Log levels configuration
export const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

// Log colors for development
export const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'gray',
};

// Winston format options
export const winstonFormats = {
  timestamp: 'YYYY-MM-DD HH:mm:ss',
  colorize: config.env === 'development',
  json: config.env === 'production',
  prettyPrint: config.env === 'development',
}; 