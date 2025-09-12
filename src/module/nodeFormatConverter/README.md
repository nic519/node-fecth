# 代理转换模块

这是一个重新设计的模块化代理转换系统，支持多种代理协议的解析和格式转换。

## 🏗️ 架构设计

### 设计原则

- **单一职责原则**: 每个类只负责一个明确的功能
- **开放封闭原则**: 易于扩展新协议和格式，无需修改现有代码
- **依赖倒置原则**: 通过抽象接口而不是具体实现进行交互
- **接口隔离原则**: 提供清晰简洁的公共API

### 模块结构

```
convertBase64ToClash/
├── models/                 # 数据模型层
│   ├── ProxyNode.ts       # 统一的代理节点数据模型
│   ├── ClashConfig.ts     # Clash配置文件数据模型
│   └── index.ts           # 公共类型和工具类
├── parsers/               # 协议解析器层
│   ├── BaseParser.ts      # 抽象基础解析器
│   ├── SSRParser.ts       # SSR协议解析器
│   └── index.ts           # 解析器统一工厂
├── converters/            # 格式转换器层
│   ├── BaseConverter.ts   # 抽象基础转换器
│   ├── ClashConverter.ts  # Clash格式转换器
│   └── index.ts           # 转换器统一工厂
├── ProxyConverterFactory.ts # 主工厂类
├── index.ts               # 模块统一入口
└── README.md              # 本文档
```

## 🚀 快速开始

### 基础用法

```typescript
import { convertBase64ToClash, convertLinksToClash } from '@/module/convertBase64ToClash';

// 转换base64订阅
const result = await convertBase64ToClash(base64Content);
if (result.success) {
  console.log('Clash配置:', result.data);
}

// 转换代理链接列表
const links = ['ssr://...', 'vmess://...'];
const result2 = await convertLinksToClash(links);
```

### 工厂模式用法

```typescript
import { ProxyConverterFactory } from '@/module/convertBase64ToClash';

const factory = ProxyConverterFactory.create({
  parser: {
    strictMode: false,
    skipInvalidNodes: true,
    maxNodes: 100
  },
  converter: {
    includeDirectProxy: true,
    enableUDP: true,
    generateProxyGroups: true,
    outputFormat: 'yaml'
  }
});

const result = await factory.convertBase64ToClash(base64Content);
```

### 高级用法

```typescript
import { SSRParser, ClashConverter } from '@/module/convertBase64ToClash';

// 直接使用解析器
const parser = new SSRParser();
const parseResult = parser.parseNode('ssr://...');

// 直接使用转换器
const converter = new ClashConverter();
const convertResult = converter.convert([node]);
```

## 📚 API 文档

### 便捷函数

#### `convertBase64ToClash(base64Content, options?)`
转换base64编码的订阅内容为Clash配置。

**参数:**
- `base64Content`: string - base64编码的订阅内容
- `options`: ConversionOptions - 可选的转换选项

**返回:** `Promise<ConversionResult<string>>`

#### `convertLinksToClash(links, options?)`
转换代理链接列表为Clash配置。

**参数:**
- `links`: string[] | string - 代理链接数组或换行分隔的字符串
- `options`: ConversionOptions - 可选的转换选项

**返回:** `Promise<ConversionResult<string>>`

#### `parseProxyLink(link)`
解析单个代理链接。

**参数:**
- `link`: string - 代理链接

**返回:** `Promise<ConversionResult<ProxyNode>>`

### 转换选项

```typescript
interface ConversionOptions {
  includeDirectProxy?: boolean;     // 包含直连代理
  enableUDP?: boolean;              // 启用UDP
  generateProxyGroups?: boolean;    // 生成代理组
  regionGrouping?: boolean;         // 地区分组
  customGroupName?: string;         // 自定义组名
  filter?: {                        // 节点过滤器
    include?: string[];             // 包含关键词
    exclude?: string[];             // 排除关键词
    protocols?: string[];           // 协议过滤
  };
  customRules?: string[];           // 自定义规则
  outputFormat?: 'yaml' | 'json';   // 输出格式
}
```

### 数据模型

#### ProxyNode
统一的代理节点数据结构，支持各种协议类型：

```typescript
type ProxyNode = 
  | ShadowsocksNode 
  | ShadowsocksRNode 
  | VmessNode 
  | VlessNode 
  | TrojanNode 
  | HysteriaNode 
  | Hysteria2Node;
```

#### ConversionResult
转换结果结构：

```typescript
interface ConversionResult<T = string> {
  success: boolean;
  data?: T;
  error?: string;
  stats?: SubscriptionInfo;
  warnings?: string[];
}
```

## 🔧 扩展指南

### 添加新协议支持

1. **创建节点模型** (在 `models/ProxyNode.ts`)
```typescript
export interface NewProtocolNode extends BaseProxyNode {
  type: ProxyProtocol.NEW_PROTOCOL;
  // 协议特定字段
}
```

2. **创建解析器** (在 `parsers/`)
```typescript
export class NewProtocolParser extends BaseParser<NewProtocolNode> {
  getSupportedProtocols(): string[] {
    return ['newprotocol://'];
  }
  
  parseNode(url: string): ParseResult<NewProtocolNode> {
    // 实现解析逻辑
  }
  
  generateNodeUrl(node: NewProtocolNode): string {
    // 实现生成逻辑
  }
}
```

3. **注册解析器** (在 `parsers/index.ts`)
```typescript
ParserRegistry.register(['newprotocol://'], () => new NewProtocolParser());
```

### 添加新输出格式支持

1. **创建转换器** (在 `converters/`)
```typescript
export class NewFormatConverter extends BaseConverter<ProxyNode[], string> {
  getSupportedSourceFormats(): string[] {
    return ['nodes'];
  }
  
  getSupportedTargetFormats(): string[] {
    return ['newformat'];
  }
  
  convert(nodes: ProxyNode[]): ConversionResult<string> {
    // 实现转换逻辑
  }
}
```

2. **注册转换器** (在 `converters/index.ts`)
```typescript
ConverterRegistry.register(['nodes'], ['newformat'], () => new NewFormatConverter());
```

## 🧪 测试示例

查看 `examples/exampleNewProxyConverter.ts` 了解完整的使用示例。

运行示例：
```bash
cd /path/to/project
npx ts-node src/example/exampleNewProxyConverter.ts
```

## 📝 支持的协议

当前支持的协议：
- ✅ ShadowsocksR (SSR)
- 🔄 Shadowsocks (SS) - 开发中
- 🔄 VMess - 开发中
- 🔄 VLESS - 开发中
- 🔄 Trojan - 开发中

## 📝 支持的输出格式

当前支持的输出格式：
- ✅ Clash (YAML/JSON)
- 🔄 Surge - 计划中
- 🔄 QuantumultX - 计划中

## 🛠️ 开发与贡献

### 开发环境设置
```bash
# 安装依赖
yarn install

# 类型检查
yarn type-check

# 运行示例
yarn example:new-converter
```

### 代码规范
- 使用 TypeScript 严格模式
- 遵循单一职责原则
- 添加完整的类型定义
- 编写单元测试
- 添加文档注释

## 📊 性能特性

- 🚀 **高性能**: 模块化设计减少不必要的依赖
- 🔄 **流式处理**: 支持大量节点的批量处理
- 💾 **内存友好**: 避免不必要的数据复制
- ⚡ **懒加载**: 按需初始化解析器和转换器
- 🛡️ **错误隔离**: 单个节点错误不影响整体处理

## 🔧 配置选项

### 解析器选项
```typescript
interface ParserOptions {
  strictMode?: boolean;        // 严格模式
  skipInvalidNodes?: boolean;  // 跳过无效节点
  maxNodes?: number;           // 最大节点数量
  timeout?: number;            // 超时时间（毫秒）
}
```

### 转换器选项
```typescript
interface ConversionOptions {
  includeDirectProxy?: boolean;
  enableUDP?: boolean;
  generateProxyGroups?: boolean;
  regionGrouping?: boolean;
  customGroupName?: string;
  filter?: FilterOptions;
  customRules?: string[];
  outputFormat?: 'yaml' | 'json';
}
```

## 🤝 向后兼容性

为了保持向后兼容，旧的API仍然可用：

```typescript
// 旧API（仍然支持）
import { NodeConverter, ExtractClashNode } from '@/module/convertBase64ToClash';

const nodeConverter = new NodeConverter(innerUser);
const result = nodeConverter.convertBySub();
```

建议逐步迁移到新的API以获得更好的类型安全和功能支持。

## 📄 许可证

本项目采用 MIT 许可证。
