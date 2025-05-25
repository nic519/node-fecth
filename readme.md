# ExtractClashNode - Clash节点提取器

这个类可以从Clash配置文件中提取节点信息，并支持多种输出格式，包括原始代理链接格式。

## 功能特性

- ✅ 解析Clash YAML配置文件
- ✅ 支持多种输出格式（JSON、简单文本、原始代理链接）
- ✅ 支持多种代理协议（Shadowsocks、Trojan、VMess、VLESS）
- ✅ 按类型和关键词筛选节点
- ✅ 向后兼容原有API

## 支持的输出格式

### 1. JSON格式 (`OutputFormat.JSON`)
```json
[
  {
    "name": "🇭🇰 香港01",
    "type": "ss",
    "server": "example.com",
    "port": 443,
    "password": "password123"
  }
]
```

### 2. 简单文本格式 (`OutputFormat.SIMPLE`)
```
🇭🇰 香港01 | ss | example.com:443
🇸🇬 新加坡01 | trojan | example2.com:443
```

### 3. 原始代理链接格式 (`OutputFormat.ORIGINAL_LINKS`)
```
ss://YWVzLTEyOC1nY206cGFzc3dv8cmQxMjM=@example.com:443#%F0%9F%87%AD%F0%9F%87%B0%20%E9%A6%99%E6%B8%AF01
trojan://password123@example2.com:443?allowInsecure=1#%F0%9F%87%B8%F0%9F%87%AC%20%E6%96%B0%E5%8A%A0%E5%9D%A101
```

## 使用方法

### 基本用法

```typescript
import { ExtractClashNode, OutputFormat } from './src/module/extractClashNode';

const extractor = new ExtractClashNode();
const yamlContent = `
proxies:
  - name: "🇭🇰 香港01"
    type: ss
    server: example.com
    port: 443
    cipher: aes-128-gcm
    password: password123
`;

// 获取不同格式的输出
const jsonOutput = extractor.getNodes(yamlContent, OutputFormat.JSON);
const simpleOutput = extractor.getNodes(yamlContent, OutputFormat.SIMPLE);
const linksOutput = extractor.getNodes(yamlContent, OutputFormat.ORIGINAL_LINKS);
```

### 便捷方法

```typescript
// 直接获取原始代理链接
const originalLinks = extractor.getOriginalLinks(yamlContent);

// 获取JSON格式（向后兼容）
const jsonData = extractor.getNodesAsJson(yamlContent);
```

### 筛选功能

```typescript
// 按类型筛选（支持所有输出格式）
const ssNodes = extractor.getNodesByType(yamlContent, 'ss', OutputFormat.ORIGINAL_LINKS);
const trojanNodes = extractor.getNodesByType(yamlContent, 'trojan', OutputFormat.JSON);

// 按关键词筛选
const hkNodes = extractor.getNodesByKeyword(yamlContent, '香港', OutputFormat.ORIGINAL_LINKS);
const sgNodes = extractor.getNodesByKeyword(yamlContent, '新加坡', OutputFormat.SIMPLE);
```

## 支持的代理协议

### Shadowsocks (ss)
- 支持各种加密方法
- 自动生成标准的ss://链接格式

### Trojan
- 支持TLS配置
- 支持SNI和证书验证设置
- 生成trojan://链接格式

### VMess
- 支持WebSocket传输
- 支持TLS加密
- 生成vmess://链接格式

### VLESS
- 支持多种传输协议
- 支持TLS配置
- 生成vless://链接格式

## API参考

### 主要方法

#### `getNodes(yamlContent: string, format: OutputFormat): string`
根据指定格式返回节点信息

#### `getOriginalLinks(yamlContent: string): string`
获取原始代理链接格式的节点信息

#### `getNodesByType(yamlContent: string, type: string, format?: OutputFormat): string`
按代理类型筛选节点

#### `getNodesByKeyword(yamlContent: string, keyword: string, format?: OutputFormat): string`
按名称关键词筛选节点

### 向后兼容方法

#### `getNodesAsJson(yamlContent: string): string`
返回JSON格式的节点信息（保持向后兼容）

#### `getSimpleNodes(yamlContent: string): SimpleNode[]`
返回简化的节点对象数组

#### `getAllNodes(yamlContent: string): ClashNode[]`
返回完整的节点对象数组

## 输出格式枚举

```typescript
export enum OutputFormat {
  JSON = 'json',           // JSON格式
  SIMPLE = 'simple',       // 简单文本格式
  ORIGINAL_LINKS = 'links' // 原始代理链接格式
}
```

## 运行示例

```bash
# 安装依赖
npm install

# 运行示例
npx ts-node example.ts
```

这将展示所有支持的输出格式和功能。

## 安全解析订阅

背景：
clash/sing-box等工具，优势就是他们的分组策略，可以做得很灵活，所以我使用他们的方式是：
- 仅使用机场的节点，而不使用他们的分组策略
- 自己写分组策略，使用类似 https://sub.dler.io 的订阅转换器合成自己的规则与节点

❌ 以上方式，缺点是：
1. 节点可能泄露
2. 这种方式更新回来的内容，有时会因为某环节网络问题，导致回来的配置有问题而影响上网

✔ 本项目解决的问题：
1. 当把节点给 sub.dler.io 这类转换器的时候，会生成随机的、无效的节点去转换，等转换回来后，再用真实的节点去替换
2. 当把最终结果返回给客户端的时候，会对结果进行校验，通过才会下发，否则status code 返回 500，避免在自动更新订阅的场景，无效节点下发到客户端而影响上网的问题

## 本地调试
```bash
npx wrangler dev

```

## 部署
```bash
npx wrangler deploy --keep-vars  
```

在worker里面需要设置json环境变量：

key为`USER_CONFIGS`，value为json，格式如下：
```json
{
	"519": {
		"ACCESS_TOKEN": "d2fs1s12f3",
		"FILE_NAME": "配置名称",
		"SUB_URL": "https://xxx.xxx/xxx"
	}
}
```
在前端的访问地址是：https://worker域名/519?token=d2fs1s12f3

每个key，代表一个配置，其中配置可以填这些值：
- ACCESS_TOKEN: 访问token，用于验证请求，自己随机生成就好
- FILE_NAME（可选）: 配置名称，用于在客户端显示
- SUB_URL: 机场订阅链接
- RULE_URL（可选）: 分流规则
- ENGINE（可选）: 转换订阅的网址