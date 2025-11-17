// src/services/websocket/utils/logger.ts
enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
  }
  
  // ตั้งค่าระดับการบันทึกล็อก (DEBUG ในขณะพัฒนา, INFO/WARN ในการผลิต)
  const CURRENT_LOG_LEVEL = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO;
  
  class Logger {
    debug(message: string, ...args: unknown[]): void {
      if (CURRENT_LOG_LEVEL <= LogLevel.DEBUG) {
        console.debug(`[WebSocket] ${message}`, ...args);
      }
    }
  
    info(message: string, ...args: unknown[]): void {
      if (CURRENT_LOG_LEVEL <= LogLevel.INFO) {
        console.info(`[WebSocket] ${message}`, ...args);
      }
    }
  
    warn(message: string, ...args: unknown[]): void {
      if (CURRENT_LOG_LEVEL <= LogLevel.WARN) {
        console.warn(`[WebSocket] ${message}`, ...args);
      }
    }
  
    error(message: string, ...args: unknown[]): void {
      if (CURRENT_LOG_LEVEL <= LogLevel.ERROR) {
        console.error(`[WebSocket] ${message}`, ...args);
      }
    }
  }
  
  export const logger = new Logger();
  
  // Export index.ts
  export * from './logger';