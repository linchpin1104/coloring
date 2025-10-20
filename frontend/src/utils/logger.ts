// 프론트엔드 로거 유틸리티
/* eslint-disable no-console */

// interface LogLevel {
//   ERROR: 'error';
//   WARN: 'warn';
//   INFO: 'info';
//   DEBUG: 'debug';
// }

// const LOG_LEVELS: LogLevel = {
//   ERROR: 'error',
//   WARN: 'warn',
//   INFO: 'info',
//   DEBUG: 'debug',
// };

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development';
  private isProduction = import.meta.env.MODE === 'production';

  private shouldLog(level: string): boolean {
    if (this.isDevelopment) return true;
    if (this.isProduction && level === 'error') return true;
    return false;
  }

  private formatMessage(level: string, message: string, ..._args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return `${prefix} ${message}`;
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args);
    }
    
    // 프로덕션에서는 에러 추적 서비스로 전송
    if (this.isProduction) {
      // TODO: 에러 추적 서비스 (Sentry, LogRocket 등)로 전송
      this.sendToErrorTracking('error', message, args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  private sendToErrorTracking(_level: string, _message: string, _args: unknown[]): void {
    // 프로덕션 환경에서 에러 추적 서비스로 전송
    // 예: Sentry, LogRocket, DataDog 등
    try {
      // 에러 추적 서비스 API 호출
      // 예: Sentry.captureException(new Error(message));
    } catch (error) {
      // 에러 추적 서비스 호출 실패 시 무시
    }
  }
}

export const logger = new Logger();
export default logger;
