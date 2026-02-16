/* eslint-disable @typescript-eslint/no-explicit-any */
// Edge Runtime compatible logger
// Replaces pino with a lightweight console wrapper

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogFn {
  (obj: object, msg?: string, ...args: any[]): void;
  (msg: string, ...args: any[]): void;
}

export interface Logger {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  child: (bindings: Record<string, any>) => Logger;
}

class ConsoleLogger implements Logger {
  private context: Record<string, any>;

  constructor(context: Record<string, any> = {}) {
    this.context = context;
  }

  private log(level: LogLevel, args: any[]) {
    const timestamp = new Date().toISOString();
    let msg = '';
    let obj = {};

    if (typeof args[0] === 'string') {
      msg = args[0];
      if (args.length > 1) {
        // Simple interpolation or extra args
      }
    } else if (typeof args[0] === 'object') {
      obj = args[0];
      if (typeof args[1] === 'string') {
        msg = args[1];
      }
    }

    const logEntry = {
      level,
      time: timestamp,
      msg,
      ...this.context,
      ...obj,
    };

    // In Edge/Browser, console.log handles objects well
    switch (level) {
      case 'debug':
        console.debug(JSON.stringify(logEntry));
        break;
      case 'info':
        console.info(JSON.stringify(logEntry));
        break;
      case 'warn':
        console.warn(JSON.stringify(logEntry));
        break;
      case 'error':
        console.error(JSON.stringify(logEntry));
        break;
    }
  }

  debug(...args: any[]) {
    this.log('debug', args);
  }

  info(...args: any[]) {
    this.log('info', args);
  }

  warn(...args: any[]) {
    this.log('warn', args);
  }

  error(...args: any[]) {
    this.log('error', args);
  }

  child(bindings: Record<string, any>): Logger {
    return new ConsoleLogger({ ...this.context, ...bindings });
  }
}

export const logger = new ConsoleLogger({ name: 'node-fetch-app', version: '1.0.0' });

export function createModuleLogger(module: string, additionalContext: Record<string, any> = {}) {
  return logger.child({
    module,
    ...additionalContext
  });
}

export class PerformanceTracker {
  private startTime: number;
  private operation: string;
  private metadata: Record<string, any>;
  private logger: Logger;

  constructor(logger: Logger, operation: string, metadata: Record<string, any> = {}) {
    this.logger = logger;
    this.operation = operation;
    this.metadata = metadata;
    this.startTime = performance.now();

    this.logger.info({
      operation,
      ...metadata
    }, '操作开始');
  }

  end(additionalMetadata: Record<string, any> = {}): number {
    const duration = performance.now() - this.startTime;
    const durationMs = Math.round(duration * 100) / 100;

    this.logger.info({
      operation: this.operation,
      duration: durationMs,
      ...this.metadata,
      ...additionalMetadata
    }, '操作完成');

    if (duration > 10000) {
      this.logger.warn({
        operation: this.operation,
        duration: durationMs,
        threshold: 10000
      }, '操作耗时过长');
    }

    return duration;
  }

  error(error: Error, additionalMetadata: Record<string, any> = {}): number {
    const duration = performance.now() - this.startTime;
    const durationMs = Math.round(duration * 100) / 100;

    this.logger.error({
      operation: this.operation,
      duration: durationMs,
      error: error.message,
      stack: error.stack,
      ...this.metadata,
      ...additionalMetadata
    }, '操作失败');

    return duration;
  }

  step(step: string, additionalMetadata: Record<string, any> = {}) {
    const currentDuration = performance.now() - this.startTime;
    const durationMs = Math.round(currentDuration * 100) / 100;

    this.logger.debug({
      operation: this.operation,
      step,
      currentDuration: durationMs,
      ...this.metadata,
      ...additionalMetadata
    }, '操作步骤');
  }

  getCurrentDuration(): number {
    return performance.now() - this.startTime;
  }
}

export function createPerformanceTracker(
  logger: Logger,
  operation: string,
  metadata: Record<string, any> = {}
): PerformanceTracker {
  return new PerformanceTracker(logger, operation, metadata);
}
