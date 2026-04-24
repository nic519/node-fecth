# Clash 模板可视化编辑器设计

## 背景

当前管理员模板编辑器通过 `YamlEditor` 直接编辑原始 YAML。后端模板 API 仍然保存并返回同一个 `content` 字符串，本次改造不能改变现有存储和读取路径。

Clash/mihomo 的 `proxy-groups` 决定出站策略的组织方式。当前模板里大量使用 YAML anchors，例如 `*country_pr`、`*asia_pr`，因此可视化编辑必须避免把这些引用展开成普通数组。

参考资料：

- https://wiki.metacubex.one/en/config/proxy-groups/
- https://wiki.metacubex.one/en/config/proxy-groups/url-test/
- https://wiki.metacubex.one/en/config/proxy-groups/fallback/
- https://wiki.metacubex.one/en/config/proxy-groups/load-balance/
- https://wiki.metacubex.one/en/config/proxy-groups/relay/

## 目标

1. 在保留原始 YAML 编辑能力的同时，为最常见的模板编辑动作增加可视化交互层。
2. 第一阶段聚焦 `proxy-groups`，展示策略组数量、类型、`proxies` 数量、`use` 数量、`include-all` 和 filter 相关字段。
3. 允许管理员按策略组类型编辑常用字段：`select` 以候选来源和筛选为主，`url-test` 额外编辑测速参数，`fallback` 编辑故障切换健康检查参数，`load-balance` 编辑均衡策略。
4. 允许管理员可视化编辑 `proxy-groups[].filter`，并在同一个模板内复用已有 filter。
5. 所有变更在点击现有保存按钮前，都只更新当前选中模板的 `configContent` 字符串。

## 非目标

1. 不修改数据库结构、API 路由、模板 service 方法或订阅读取行为。
2. 第一阶段不构建完整的 Clash/mihomo 规则 IDE。
3. 第一阶段不编辑 `rules`、`rule-providers` 或网站规则。
4. 第一阶段不做跨模板或全局 filter 预设库；filter 复用范围限定在当前模板内。
5. 不隐藏原始源码编辑器，因为复杂 YAML 仍然需要手写能力兜底。

## 推荐方案

在 `TemplateEditor` 里使用渐进式双栏编辑器：

- 编辑态隐藏外层模板列表，让 YAML 编辑获得完整页面宽度。
- 编辑器内部扩展为三列：左列是策略组目录，按 `select` 和 `url-test` 分组列出 item；中列是当前 item 的编辑内容；右列是现有 YAML 编辑器。
- `select` 和 `url-test` 不能放在同一个筛选器或下拉框里，因为它们对应不同任务模型。
- 可视化工具使用 `js-yaml` 解析当前 YAML 字符串；写回时优先使用文本级替换修改单个策略组字段，以保留 `&country_pr`、`*country_pr` 这类 anchors。
- 如果 YAML 解析失败或缺少预期字段，可视化工具显示非阻塞的禁用状态，原始编辑器继续可用。

这个方案不改变存储模型，也能让第一版有实际价值，同时避免过早承诺支持所有 Clash 语法变体。

## 组件

### `clash-template-utils`

新增一个可在客户端使用的小型工具模块，专门负责 YAML 解析和变更。

职责：

- 将模板 YAML 解析成有类型的工作对象。
- 从 `proxy-groups` 提取策略组名称。
- 从 `proxy-groups` 提取策略组摘要，包括 `type`、`proxies`、`use`、健康检查字段、包含来源字段和 filter 族字段。
- 从 `rules` 和 `rule-providers` 推断 `select` 策略组的规则关联，例如 `RULE-SET,cursor_domain,[单]-Cursor🐶` 会关联到 `rule-providers.cursor_domain.url`。
- 从 `proxy-groups` 提取已有 `filter` 作为模板内预设。
- 将简单 filter 拆成“包含关键词”和“排除关键词”，并能重新生成正则。
- 将某个 filter 预设应用到同模板内的其他策略组。
- 更新单个策略组字段时优先做文本级替换，以保留 YAML anchors 的原始命名和引用。
- 只修改受支持的 section，保留其他不认识的顶层字段。

### `TemplateVisualTools`

新增一个 UI 组件，只要选中了模板就渲染。

职责：

- 展示 YAML 解析状态、策略组数量和 filter 数量。
- 提供两个独立工作区：
  - `select`：只列出 `type: select` 的策略组，展示候选来源、规则关联，并编辑 `include-all`、`include-all-proxies`、`include-all-providers`、`exclude-filter`、`exclude-type`、`hidden`、`icon` 和 `filter`。
  - `url-test`：只列出 `type: url-test` 的策略组，在通用字段外编辑 `url`、`interval`、`timeout`、`max-failed-times`、`lazy`、`tolerance`。
  - `fallback`：在通用字段外，编辑 `url`、`interval`、`timeout`、`max-failed-times`、`lazy`。
  - `load-balance`：在通用字段外，编辑 `strategy`，支持 `consistent-hashing`、`round-robin`、`sticky-sessions`。
  - `relay`：识别并展示，但由于 mihomo 已提示废弃，不作为第一阶段重点编辑类型。
- 提供 filter 预设表单：
  - 从当前模板已有 `proxy-groups[].filter` 提取可复用预设
  - 选择来源策略组
  - 目标默认为当前正在编辑的策略组
  - 对简单 filter 提供包含/排除关键词编辑
  - 对复杂 filter 保留原文编辑框
- 通过 `onUpdateConfigContent` 触发 YAML 内容更新。

### `TemplateEditor`

`TemplateEditor` 保持现有头部、元信息编辑、校验错误展示和 YAML 编辑器。编辑模式下，编辑器主体改成响应式分栏布局：

- 非编辑态保留外层“模板列表 + 详情”的双栏布局。
- 编辑态隐藏外层模板列表，主区域独占宽度。
- 桌面端编辑器内部显示三列：左侧分组目录、中间编辑内容、右侧 YAML 编辑器。
- 窄屏下，可视化工具堆叠在 YAML 编辑器上方。
- 只读模式下，可视化工具可以展示解析摘要，但变更控件需要禁用。

## 数据流

1. `TemplateEditor` 接收 `currentConfigContent`。
2. `TemplateVisualTools` 使用 `js-yaml` 解析该字符串。
3. 用户在 `select` 或 `url-test` 独立工作区中选择同类型策略组。
4. 工具函数返回新的 YAML 字符串。
5. `TemplateEditor` 调用 `onUpdateConfigContent(newContent)`。
6. 管理员仍然通过现有保存按钮提交模板，现有校验和保存行为保持不变。

## Select 规则关联

`select` 策略组不只是候选节点列表，它通常对应一组规则集。例如：

- `rules` 中存在 `RULE-SET,cursor_domain,[单]-Cursor🐶`
- `rule-providers.cursor_domain.url` 指向 `cursor.mrs`

可视化编辑器需要在 `select` 工作区展示这条关联，让管理员能看到某个应用策略实际由哪些 `RULE-SET` 驱动。第一阶段只展示关联和 URL，不直接编辑 `rules` 或 `rule-providers`；后续再设计新增/修改规则集的交互。

## 字段范围

第一阶段可写字段分为三层：

1. 通用可写字段：`include-all`、`include-all-proxies`、`include-all-providers`、`exclude-filter`、`exclude-type`、`hidden`、`icon`、`filter`。
2. 健康检查字段：`url`、`interval`、`lazy`、`timeout`、`max-failed-times`、`expected-status`。
3. 类型专属字段：`url-test.tolerance` 和 `load-balance.strategy`。

`proxies` 和 `use` 第一阶段先展示数量和候选预览，不提供完整列表重排。原因是当前模板大量使用 YAML anchors，直接把 `proxies: *country_pr` 变成普通数组会破坏模板可维护性。后续如果要编辑 `proxies/use`，需要先设计“选择 anchor / 选择内联列表 / 保留引用”的专门交互。

## Filter 预设行为

Filter 预设只在当前模板内复用，不引入新的持久化结构。

- 任何带有 `filter` 字段的 `proxy-groups` 都会成为一个可选预设。
- 预设名称默认使用来源策略组名称。
- 支持解析常见的正向/反向 lookahead：
  - 包含关键词：`(?=(港|HK|Hong|🇭🇰))`
  - 排除关键词：`(?!.*(1\\.5|倍率:2|Emby))`
- UI 展示时将 `1\\.5` 还原为 `1.5`，写回 YAML 时再转义为正则安全形式。
- 如果 filter 无法被安全拆解，UI 仍然展示原始 filter，并允许原文复用。
- 应用预设时，目标默认为当前策略组，只更新目标策略组的 `filter` 字段，不改动 `type`、`include-all`、`tolerance`、`interval` 等其他字段。

## 错误处理

- YAML 无效：禁用可视化变更控件，并提示需要先修复原始 YAML。
- 缺少 `proxy-groups`：显示空状态，不影响原始 YAML 编辑器。
- 缺少可复用 filter：filter 预设区域显示空状态，不影响其他工具。
- filter 为空：应用时删除目标策略组的 `filter` 字段。
- 无法安全文本替换 filter：退回结构化 YAML dump；这可能改变格式，因此只作为兜底路径。

## 测试

为 YAML 工具模块添加聚焦测试：

1. 能提取策略组摘要。
2. 无效 YAML 会返回解析错误状态。
3. 能从策略组提取 filter 预设，并拆解包含/排除关键词。
4. 能将 filter 预设应用到另一个策略组，且不修改其他字段。
5. 更新 filter 时保留 `&country_pr`、`*country_pr` 这类 YAML anchors。

如果现有测试环境支持轻量组件渲染测试，可以补充覆盖组件行为；否则第一阶段至少验证工具层，并运行 lint。

## 后续交互阶段

第一阶段稳定后，再讨论和设计：

1. 规则表格，支持编辑、删除、启用/禁用和排序。
2. 跨模板或全局 filter 预设库。
3. 网站规则新增和 rule-provider 创建，以及 `RULE-SET` 绑定。
4. 可视化变更应用前的 YAML diff 预览。
5. 可视化操作历史，用于撤销编辑。
6. 更完整的 Clash/mihomo 校验，覆盖 logical rules、sub-rules、端口、进程规则等边缘语法。
