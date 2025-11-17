// src/utils/logger.ts
/* eslint-disable no-console */

/**
 * Logger Utility
 *
 * Development-only logging utility that prevents console.log statements
 * from appearing in production builds while keeping error and warning logs.
 *
 * Usage:
 * ```ts
 * import { logger } from '@/utils/logger';
 *
 * logger.log('Debug info');           // Development only
 * logger.info('Info message');        // Development only
 * logger.warn('Warning message');     // Both dev and prod
 * logger.error('Error message');      // Both dev and prod
 * logger.group('Group name');         // Development only
 * logger.groupEnd();                  // Development only
 * ```
 */

class Logger {
  private isDevelopment: boolean;
  private prefix: string;

  constructor(prefix = '') {
    this.isDevelopment = import.meta.env.DEV;
    this.prefix = prefix;
  }

  /**
   * Development-only log
   * Will not appear in production
   */
  log(...args: any[]) {
    if (this.isDevelopment) {
      console.log(this.prefix, ...args);
    }
  }

  /**
   * Development-only info
   * Will not appear in production
   */
  info(...args: any[]) {
    if (this.isDevelopment) {
      console.info(this.prefix, ...args);
    }
  }

  /**
   * Development-only debug
   * Will not appear in production
   */
  debug(...args: any[]) {
    if (this.isDevelopment) {
      console.debug(this.prefix, ...args);
    }
  }

  /**
   * Warning log
   * Will appear in both development and production
   */
  warn(...args: any[]) {
    console.warn(this.prefix, ...args);
  }

  /**
   * Error log
   * Will appear in both development and production
   */
  error(...args: any[]) {
    console.error(this.prefix, ...args);
  }

  /**
   * Development-only group
   */
  group(label: string) {
    if (this.isDevelopment) {
      console.group(this.prefix + label);
    }
  }

  /**
   * Development-only groupCollapsed
   */
  groupCollapsed(label: string) {
    if (this.isDevelopment) {
      console.groupCollapsed(this.prefix + label);
    }
  }

  /**
   * Development-only groupEnd
   */
  groupEnd() {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * Development-only table
   */
  table(data: any) {
    if (this.isDevelopment) {
      console.table(data);
    }
  }

  /**
   * Development-only time
   */
  time(label: string) {
    if (this.isDevelopment) {
      console.time(this.prefix + label);
    }
  }

  /**
   * Development-only timeEnd
   */
  timeEnd(label: string) {
    if (this.isDevelopment) {
      console.timeEnd(this.prefix + label);
    }
  }

  /**
   * Create a scoped logger with a specific prefix
   */
  createScoped(scope: string): Logger {
    return new Logger(`${this.prefix}[${scope}] `);
  }
}

// Default logger instance
export const logger = new Logger();

// Scoped loggers for specific modules
export const wsLogger = logger.createScoped('WebSocket');
export const authLogger = logger.createScoped('Auth');
export const apiLogger = logger.createScoped('API');
export const storeLogger = logger.createScoped('Store');

// Export the Logger class for custom instances
export { Logger };

export default logger;
