# Visual-v1 模板模型设计

## 背景

现有模板的唯一事实来源是 Clash/Mihomo YAML 原文。这个模式适合兼容复杂配置，但不适合做真正的图形化编辑：管理员需要理解 anchors、`proxy-groups`、`rules`、`rule-providers`、filter 正则和字段顺序，交互层只能在 YAML 上做有限辅助。

新的 `visual-v1` 模板格式需要把“人要维护的意图”和“Clash 最终 YAML”分开。管理员维护中间模型，系统负责把模型编译成 Clash/Mihomo YAML。

## 目标

1. 保留旧模板格式，命名为 `yaml` 模板格式，不改变其读取、保存、订阅和下载逻辑。
2. 新增 `visual-v1` 模板格式，只让新建可视化模板进入模型化编辑器。
3. `visual-v1` 以中间模型为唯一事实来源，编译后生成最终 Clash YAML。
4. 订阅接口仍然读取最终 YAML 字符串，不需要理解中间模型。
5. 模型中只保留用户真正关心的策略、引用、规则集和筛选条件，不暴露 YAML anchors 这类生成细节。

## 非目标

1. 不自动把现有 `yaml` 模板迁移为 `visual-v1`。
2. 不让同一个模板同时以 YAML 原文和 visual model 作为事实来源。
3. 第一阶段不覆盖 Clash/Mihomo 的所有高级字段；只覆盖当前模板常用的 `select`、`url-test`、`RULE-SET`、`rule-providers` 和 filter。
4. 不要求旧模板获得完整可视化编辑能力；旧模板可以保留只读解析和安全跳转。

## 模板格式

模板增加格式概念：

```ts
type TemplateFormat = 'yaml' | 'visual-v1';
```

旧格式：

```ts
type YamlTemplate = {
  format: 'yaml';
  content: string;
};
```

新格式：

```ts
type VisualTemplate = {
  format: 'visual-v1';
  content: string;
  visualModel: VisualTemplateModel;
};
```

`content` 始终保存最终 Clash/Mihomo YAML。这样订阅、下载和复制配置可以继续使用同一字段。`visual-v1` 保存时先更新 `visualModel`，再编译出新的 `content`。

## 核心模型

`Policy` 是唯一核心实体。`select`、`url-test`、应用策略、类别策略、系统策略和地区自动组都用 `Policy` 表达。

```ts
type VisualTemplateModel = {
  version: 1;
  policies: Policy[];
  providerDefaults: RuleProviderDefaults;
  urlTestDefaults: UrlTestDefaults;
};
```

```ts
type Policy = {
  id: string;
  title: string;
  compileName: string;
  type: 'select' | 'url-test';

  tags?: PolicyTag[];

  proxies?: PolicyRef[];
  rules?: RuleSetRef[];

  includeAll?: boolean;
  includeAllProxies?: boolean;
  includeAllProviders?: boolean;
  filter?: FilterPreset;

  urlTest?: UrlTestOptions;
};
```

```ts
type PolicyTag =
  | 'app'
  | 'collection'
  | 'system'
  | 'region'
  | 'manual';
```

`type` 表示 Clash 策略组类型。`tags` 只影响 UI 分组、默认命名和快捷筛选，不影响编译逻辑。

## 引用模型

策略之间只通过 `id` 引用。

```ts
type PolicyRef = {
  id: string;
};
```

不存 `source`。如果需要判断引用目标来自用户策略还是系统内置项，编译器通过 `id` 解析：

```ts
type BuiltinPolicy = {
  id: string;
  compileName: string;
};
```

系统内置项不写入用户模型，例如：

```ts
const BUILTIN_POLICIES = [
  { id: 'direct', compileName: '🇨🇳 直连' },
  { id: 'reject', compileName: 'REJECT' },
];
```

## 规则集模型

`RuleSetRef` 表示一个 `RULE-SET` 和对应的 `rule-providers` 项。

```ts
type RuleSetRef = {
  id: string;
  providerKey: string;
  behavior: 'domain' | 'ipcidr' | 'classical';
  format: 'mrs' | 'yaml' | 'text';
  url: string;
  noResolve?: boolean;
};
```

一个 policy 可以有多个规则集。单应用和类别应用不再分成两种实体，只是 `rules` 数量和 `tags` 不同。

例如 Pandora：

```ts
{
  id: 'pandora',
  title: 'Pandora',
  compileName: '[单]-Pandora🎵',
  type: 'select',
  tags: ['app'],
  proxies: [{ id: 'foreign' }, { id: 'direct' }],
  rules: [
    {
      id: 'pandora-domain',
      providerKey: 'pandora_domain',
      behavior: 'domain',
      format: 'mrs',
      url: 'https://example.com/pandora.mrs'
    }
  ]
}
```

例如海外 AI：

```ts
{
  id: 'oversea-ai',
  title: '海外 AI',
  compileName: '[类]-海外AI🤖',
  type: 'select',
  tags: ['collection'],
  proxies: [{ id: 'auto-tw' }, { id: 'auto-sg' }, { id: 'auto-jp' }],
  rules: [
    {
      id: 'ai-domain',
      providerKey: 'ai',
      behavior: 'domain',
      format: 'mrs',
      url: 'https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-ai-!cn.mrs'
    }
  ],
  includeAll: true,
  filter: {
    include: ['台', 'TW', '坡', 'SG', '日', 'JP', '香港', 'HK']
  }
}
```

## Filter 模型

```ts
type FilterPreset = {
  include?: string[];
  exclude?: string[];
  raw?: string;
};
```

优先使用 `include` 和 `exclude` 生成正则。只有无法结构化表达时才使用 `raw`。

编译示例：

```ts
{ include: ['港', 'HK'], exclude: ['1.5', '倍率:2'] }
```

输出：

```yaml
filter: "(?=(港|HK))(?!.*(1\\.5|倍率:2))"
```

## URL-Test 模型

`url-test` 不需要独立实体，它也是 `Policy`。

```ts
type UrlTestOptions = {
  url?: string;
  interval?: number;
  tolerance?: number;
  lazy?: boolean;
  timeout?: number;
  maxFailedTimes?: number;
  expectedStatus?: string;
};
```

例如：

```ts
{
  id: 'auto-hk',
  title: '香港',
  compileName: '[自动]-香港🇭🇰',
  type: 'url-test',
  tags: ['region'],
  includeAll: true,
  filter: {
    include: ['港', 'HK', 'Hong', '🇭🇰'],
    exclude: ['1.5', '倍率:2']
  },
  urlTest: {
    interval: 200,
    tolerance: 23
  }
}
```

输出：

```yaml
- {
    name: "[自动]-香港🇭🇰",
    type: url-test,
    include-all: true,
    tolerance: 23,
    interval: 200,
    filter: "(?=(港|HK|Hong|🇭🇰))(?!.*(1\\.5|倍率:2))",
  }
```

## 编译规则

编译器输入 `VisualTemplateModel`，输出 Clash/Mihomo YAML 字符串。

基本顺序：

1. 生成基础配置、DNS、TUN 等固定片段。
2. 根据 `policies` 生成 `proxy-groups`。
3. 根据 `Policy.rules` 生成 `rules` 中的 `RULE-SET`。
4. 生成 `MATCH` 兜底规则。
5. 根据所有 `RuleSetRef` 生成 `rule-providers`。

`select` 编译规则：

- `name` 使用 `compileName`。
- `type` 输出为 `select`。
- `proxies` 由 `PolicyRef[]` 解析为目标 `compileName`。
- 内置 `direct` 输出为 `🇨🇳 直连`。
- `includeAll` 输出 `include-all`。
- `filter` 输出正则。

`url-test` 编译规则：

- `name` 使用 `compileName`。
- `type` 输出为 `url-test`。
- `includeAll` 输出 `include-all`。
- `urlTest` 字段输出到同名或 kebab-case YAML 字段。
- `filter` 输出正则。

`rules` 编译规则：

- 每个 `RuleSetRef` 输出 `RULE-SET,{providerKey},{policy.compileName}`。
- 如果 `noResolve` 为 true，追加 `,no-resolve`。
- 规则顺序默认跟 `policies` 顺序一致。

`rule-providers` 编译规则：

- `providerKey` 作为 key。
- `behavior` 和 `format` 来自 `RuleSetRef`。
- `url` 来自 `RuleSetRef.url`。
- 公共字段来自 `providerDefaults`。

## UI 行为

新建模板时提供两个入口：

1. 新建 YAML 模板
2. 新建可视化模板

打开 `yaml` 模板：

- 显示 `YAML 模板` 标识。
- 默认进入源码编辑器。
- 可以提供“尝试导入为 visual-v1”的显式动作，但不自动转换。

打开 `visual-v1` 模板：

- 显示 `可视化模板` 标识。
- 左侧显示 policy 列表，可按 tags 分组。
- 中间编辑当前 policy。
- 右侧显示编译后的 YAML 预览。
- 保存时写入 `visualModel` 和编译后的 `content`。

如果用户想直接修改编译后的 YAML：

- 不允许直接把 YAML 改回 model。
- 提供“转为 YAML 模板继续编辑”的动作。
- 转换后该模板的事实来源变成 YAML 原文，不再使用 visual model。

## 旧模板隔离

旧模板保持 `format: 'yaml'`。

- 订阅读取 `content`。
- 下载读取 `content`。
- 复制配置读取 `content`。
- 保存源码更新 `content`。
- 不要求存在 `visualModel`。

新模板使用 `format: 'visual-v1'`。

- 编辑 `visualModel`。
- 保存前编译 `content`。
- 订阅仍读取 `content`。

这个隔离保证新格式试验不会影响旧模板。

## 迁移策略

第一阶段不做自动迁移。

后续可以提供手动导入：

1. 解析现有 YAML。
2. 尝试识别 `proxy-groups`、`rules`、`rule-providers`。
3. 生成候选 `VisualTemplateModel`。
4. 展示导入预览和无法识别的片段。
5. 用户确认后创建一个新的 `visual-v1` 模板，不覆盖原模板。

## 测试

1. `visual-v1` model 可以编译出包含 `proxy-groups`、`rules`、`rule-providers` 的 YAML。
2. `PolicyRef` 能解析到用户 policy 和内置 policy。
3. `select` policy 能生成正确的 `proxies`、`RULE-SET` 和 provider。
4. `url-test` policy 能生成正确的测速字段和 filter。
5. `filter.include/exclude` 能稳定转义正则字符。
6. `yaml` 模板不经过 visual compiler。
7. `visual-v1` 保存时会同步更新 `visualModel` 和 `content`。

## 开放问题

1. `visualModel` 是新增数据库列，还是先以 JSON 注释块方式嵌入现有模板元数据。
2. 基础配置片段是固定内置，还是也作为 visual model 的一部分。
3. 是否需要内置常用规则集目录，例如 MetaCubeX geosite 的常见 app/provider URL。
4. `compileName` 是否允许自由编辑，还是由 tag 和 title 自动生成。
