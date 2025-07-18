# 🚀 API 生成器模块化架构

## 概述

这是一个完全模块化的 API 客户端生成器，遵循**单一职责原则**和**依赖注入**模式，易于测试、维护和扩展。

## 🏗️ 架构设计

### 核心设计原则

1. **单一职责** - 每个模块只负责一个特定功能
2. **依赖注入** - 通过接口实现，便于测试和扩展
3. **零硬编码** - 基于模式匹配的动态分析
4. **类型安全** - 完整的 TypeScript 支持
5. **易于扩展** - 清晰的模块边界，添加新功能只需要实现对应接口

### 模块结构

```
api-generator/
├── core/                    # 核心模块
│   ├── ApiGenerator.ts      # 主控制器（依赖注入）
│   └── types.ts            # 类型定义和接口
├── fetchers/               # 获取器模块
│   └── OpenApiSpecFetcher.ts  # OpenAPI 规范获取
├── generators/             # 生成器模块
│   ├── OazapftsGenerator.ts   # oazapfts 客户端生成
│   └── ModularExportGenerator.ts  # 模块化导出生成
├── analyzers/              # 分析器模块
│   ├── FunctionAnalyzer.ts    # 函数分析
│   └── ModuleResolver.ts      # 模块解析
├── utils/                  # 工具模块
│   ├── FileManager.ts         # 文件操作
│   └── PathResolver.ts        # 路径解析
├── index.ts               # 统一导出
└── README.md             # 本文档
```

## 📦 模块详解

### 1. Core 模块 (核心)

#### `ApiGenerator.ts`

- **职责**: 主控制器，统筹整个生成流程
- **特点**: 使用依赖注入，所有子模块都通过接口注入
- **可扩展性**: 新增功能模块只需要实现对应接口并注入

#### `types.ts`

- **职责**: 定义所有模块的接口和类型
- **特点**: 统一的类型定义，确保模块间的一致性
- **扩展方式**: 添加新接口定义新模块

### 2. Fetchers 模块 (获取器)

#### `OpenApiSpecFetcher.ts`

- **职责**: 从服务器动态获取 OpenAPI 规范
- **接口**: `IOpenApiSpecFetcher`
- **可替换**: 可以实现新的获取方式（文件、缓存等）

### 3. Generators 模块 (生成器)

#### `OazapftsGenerator.ts`

- **职责**: 使用 oazapfts 生成原始客户端
- **接口**: `IOazapftsGenerator`
- **可替换**: 可以替换为其他客户端生成器

#### `ModularExportGenerator.ts`

- **职责**: 生成模块化重新导出文件
- **接口**: `IModularExportGenerator`
- **可扩展**: 可以添加不同的导出格式

### 4. Analyzers 模块 (分析器)

#### `FunctionAnalyzer.ts`

- **职责**: 分析生成的客户端文件中的函数
- **接口**: `IFunctionAnalyzer`
- **可扩展**: 可以支持不同的函数分析策略

#### `ModuleResolver.ts`

- **职责**: 基于函数名模式确定模块分组
- **接口**: `IModuleResolver`
- **零硬编码**: 使用正则表达式模式，易于配置

### 5. Utils 模块 (工具)

#### `FileManager.ts`

- **职责**: 文件操作相关功能
- **接口**: `IFileManager`
- **功能**: 目录创建、文件清理、配置添加

#### `PathResolver.ts`

- **职责**: 路径解析和配置管理
- **接口**: `IPathResolver`
- **功能**: 统一管理所有路径配置

## 🔧 扩展指南

### 添加新的获取器

1. 实现 `IOpenApiSpecFetcher` 接口
2. 在 `ApiGenerator` 中注入新的实现

```typescript
// 示例：文件获取器
export class FileSpecFetcher implements IOpenApiSpecFetcher {
	async fetchSpec(filePath: string, outputPath: string): Promise<void> {
		// 从文件获取规范的实现
	}
}
```

### 添加新的生成器

1. 定义新的接口
2. 实现接口
3. 在主控制器中集成

```typescript
// 示例：TypeScript 接口生成器
export interface ITypeScriptInterfaceGenerator {
	generateInterfaces(spec: any): string;
}

export class TypeScriptInterfaceGenerator implements ITypeScriptInterfaceGenerator {
	generateInterfaces(spec: any): string {
		// 生成 TypeScript 接口的实现
	}
}
```

### 添加新的分析器

1. 实现相应的分析接口
2. 在分析流程中集成

```typescript
// 示例：API 文档生成器
export interface IApiDocGenerator {
	generateDocs(functions: FunctionInfo[]): string;
}
```

## 🧪 测试指南

由于使用了接口和依赖注入，每个模块都可以独立测试：

```typescript
// 示例：测试 FunctionAnalyzer
describe('FunctionAnalyzer', () => {
	it('应该正确分析函数', () => {
		const analyzer = new FunctionAnalyzer();
		const result = analyzer.analyzeFunctions('path/to/test/file.ts');
		expect(result).toHaveLength(expectedCount);
	});
});
```

## 🚀 使用方式

### 基本使用

```typescript
import { ApiGenerator } from './api-generator';

const generator = new ApiGenerator('http://localhost:8787');
await generator.generate();
```

### 自定义使用

```typescript
import {
	ApiGenerator,
	OpenApiSpecFetcher,
	CustomOazapftsGenerator, // 自定义实现
} from './api-generator';

// 可以注入自定义的实现
const generator = new ApiGenerator();
// 或者在构造函数中接受自定义依赖
```

## 💡 设计亮点

1. **完全解耦**: 每个模块独立，互不依赖
2. **易于测试**: 每个模块都可以单独进行单元测试
3. **高可扩展性**: 新增功能只需要实现接口
4. **类型安全**: 完整的 TypeScript 支持
5. **零硬编码**: 所有配置都是动态的
6. **向后兼容**: 对外接口保持一致

## 🔄 迁移说明

从原有的单体类 `ZeroHardcodeApiGenerator` 迁移到新的模块化架构：

1. **API 不变**: 主入口文件的使用方式完全一致
2. **功能增强**: 增加了模块化架构和扩展能力
3. **性能提升**: 模块化设计便于优化和缓存
4. **维护性**: 代码结构更清晰，便于维护和调试

新架构完全向后兼容，现有的使用方式无需修改。
