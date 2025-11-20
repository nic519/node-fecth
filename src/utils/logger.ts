import pino from 'pino';

/**
 * 全局日志配置
 * 提供结构化日志记录，支持开发环境美化输出和生产环境JSON格式
 */
export const logger = pino({
  name: 'node-fetch-app',
  level: process.env.LOG_LEVEL || 'info',
  // 基础元数据
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'unknown',
    version: process.env.npm_package_version || '1.0.0'
  },
  // 使用 ISO 时间戳
  timestamp: pino.stdTimeFunctions.isoTime,
  // 开发环境使用美化输出，生产环境使用纯JSON
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
      messageFormat: '{module} {msg}',
      customPrettifiers: {
        time: (timestamp: string) => {
          return `🕒 ${new Date(timestamp).toLocaleString('zh-CN')}`;
        }
      }
    }
  } : undefined,
  // 自定义序列化
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  }
});

/**
 * 创建带模块上下文的子日志记录器
 * @param module 模块名称
 * @param additionalContext 额外的上下文信息
 * @returns 带上下文的日志记录器
 */
export function createModuleLogger(module: string, additionalContext: Record<string, any> = {}) {
  return logger.child({
    module,
    ...additionalContext
  });
}

/**
 * 性能追踪器类
 * 提供高精度的操作计时和性能监控
 */
export class PerformanceTracker {
  private startTime: number;
  private operation: string;
  private metadata: Record<string, any>;
  private logger: pino.Logger;

  constructor(logger: pino.Logger, operation: string, metadata: Record<string, any> = {}) {
    this.logger = logger;
    this.operation = operation;
    this.metadata = metadata;
    this.startTime = performance.now();

    this.logger.info({
      operation,
      ...metadata
    }, '操作开始');
  }

  /**
   * 结束追踪并记录成功完成
   * @param additionalMetadata 额外的元数据
   * @returns 操作耗时（毫秒）
   */
  end(additionalMetadata: Record<string, any> = {}): number {
    const duration = performance.now() - this.startTime;
    const durationMs = Math.round(duration * 100) / 100;

    this.logger.info({
      operation: this.operation,
      duration: durationMs,
      ...this.metadata,
      ...additionalMetadata
    }, '操作完成');

    // 性能警告
    if (duration > 10000) {
      this.logger.warn({
        operation: this.operation,
        duration: durationMs,
        threshold: 10000
      }, '操作耗时过长');
    }

    return duration;
  }

  /**
   * 记录操作失败
   * @param error 错误对象
   * @param additionalMetadata 额外的元数据
   * @returns 操作耗时（毫秒）
   */
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

  /**
   * 记录中间步骤（用于长时间运行的操作）
   * @param step 步骤名称
   * @param additionalMetadata 额外的元数据
   */
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

  /**
   * 获取当前耗时（不记录日志）
   * @returns 当前耗时（毫秒）
   */
  getCurrentDuration(): number {
    return performance.now() - this.startTime;
  }
}

/**
 * 创建性能追踪器
 * @param logger 日志记录器
 * @param operation 操作名称
 * @param metadata 元数据
 * @returns 性能追踪器实例
 */
export function createPerformanceTracker(
  logger: pino.Logger,
  operation: string,
  metadata: Record<string, any> = {}
): PerformanceTracker {
  return new PerformanceTracker(logger, operation, metadata);
}