/**
 * 代理转换模块统一入口
 * 重新设计的模块化架构，提供清晰的职责分离和易于扩展的结构
 */

// 数据模型层
export * from './models';

// 解析器层
export * from './parsers';

// 转换器层
export * from './converters';

// 工厂层（主要入口）
export * from './ProxyConverterFactory';

// 向后兼容导出（旧的API）
export { ExtractClashNode, OutputFormat } from './extractClashNode';
export { NodeConverter } from './nodeConverter';

/**
 * 模块架构说明：
 *
 * 1. models/ - 数据模型层
 *    - ProxyNode.ts: 统一的代理节点数据模型
 *    - ClashConfig.ts: Clash配置文件数据模型
 *    - index.ts: 公共类型和工具类
 *
 * 2. parsers/ - 协议解析器层
 *    - BaseParser.ts: 抽象基础解析器
 *    - SSRParser.ts: SSR协议解析器
 *    - index.ts: 解析器统一工厂
 *
 * 3. converters/ - 格式转换器层
 *    - BaseConverter.ts: 抽象基础转换器
 *    - ClashConverter.ts: Clash格式转换器
 *    - index.ts: 转换器统一工厂
 *
 * 4. ProxyConverterFactory.ts - 主工厂类
 *    - 提供统一的API入口
 *    - 管理解析和转换的完整流程
 *    - 支持各种便捷方法
 *
 * 设计原则：
 * - 单一职责：每个类只负责一个明确的功能
 * - 开放封闭：易于扩展新协议和格式，不需要修改现有代码
 * - 依赖倒置：通过抽象接口而不是具体实现进行交互
 * - 接口隔离：提供清晰简洁的公共API
 *
 * 扩展指南：
 * 1. 添加新协议支持：继承BaseParser，实现具体解析逻辑
 * 2. 添加新输出格式：继承BaseConverter，实现具体转换逻辑
 * 3. 在各自的index.ts中注册新的解析器/转换器
 * 4. 工厂会自动识别和使用新的组件
 */

// 默认导出工厂实例
import { ProxyConverterFactory } from './ProxyConverterFactory';
export default ProxyConverterFactory.getInstance();
