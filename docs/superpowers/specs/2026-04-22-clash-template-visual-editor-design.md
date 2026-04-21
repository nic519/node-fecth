# Clash 模板可视化编辑器设计

## 背景

当前管理员模板编辑器通过 `YamlEditor` 直接编辑原始 YAML。后端模板 API 仍然保存并返回同一个 `content` 字符串，本次改造不能改变现有存储和读取路径。

Clash/mihomo 的路由规则是有顺序的，越靠前优先级越高。常见域名规则格式是 `TYPE,payload,policy`，`MATCH,policy` 是兜底规则。`RULE-SET` 需要配套 `rule-providers`，因此第一阶段的规则新增应优先支持直接域名规则，把 provider 管理留到后续阶段。

参考资料：

- https://wiki.metacubex.one/en/config/rules/
- https://wiki.metacubex.one/en/config/rule-providers/content/

## 目标

1. 在保留原始 YAML 编辑能力的同时，为最常见的模板编辑动作增加可视化交互层。
2. 允许管理员按地区过滤模板里的策略组，地区词汇沿用现有的 `TW`、`SG`、`JP`、`VN`、`HK`、`US`。
3. 允许管理员不用手写 YAML 行，就能新增一个网站或一批网站规则。
4. 所有变更在点击现有保存按钮前，都只更新当前选中模板的 `configContent` 字符串。

## 非目标

1. 不修改数据库结构、API 路由、模板 service 方法或订阅读取行为。
2. 第一阶段不构建完整的 Clash/mihomo 规则 IDE。
3. 第一阶段不增加 rule-provider 创建或远程 rule-set 管理。
4. 不隐藏原始源码编辑器，因为复杂 YAML 仍然需要手写能力兜底。

## 推荐方案

在 `TemplateEditor` 里使用渐进式双栏编辑器：

- 左侧：地区过滤和网站规则插入的可视化工具。
- 右侧：现有 YAML 编辑器，仍然是唯一事实来源。
- 可视化工具使用 `js-yaml` 解析当前 YAML 字符串，修改受支持的字段，再 dump 回 YAML，并调用 `onUpdateConfigContent`。
- 如果 YAML 解析失败或缺少预期字段，可视化工具显示非阻塞的禁用状态，原始编辑器继续可用。

这个方案不改变存储模型，也能让第一版有实际价值，同时避免过早承诺支持所有 Clash 语法变体。

## 组件

### `clash-template-utils`

新增一个可在客户端使用的小型工具模块，专门负责 YAML 解析和变更。

职责：

- 将模板 YAML 解析成有类型的工作对象。
- 从 `proxy-groups` 提取策略组名称。
- 根据 `ProxyAreaObjects` 的正则规则推断策略组所属地区。
- 根据选中的地区保留对应策略组，并清理引用已移除策略组的规则。
- 将生成的网站规则插入到第一个 `MATCH` 规则前；如果不存在 `MATCH`，则追加到末尾。
- 只修改受支持的 section，保留其他不认识的顶层字段。

### `TemplateVisualTools`

新增一个 UI 组件，只要选中了模板就渲染。

职责：

- 展示 YAML 解析状态、策略组数量和规则数量。
- 渲染 `TW`、`SG`、`JP`、`VN`、`HK`、`US` 地区开关。
- 提供网站规则表单：
  - 规则类型：`DOMAIN`、`DOMAIN-SUFFIX`、`DOMAIN-KEYWORD`
  - 支持输入一个或多个域名，用换行或逗号分隔
  - policy 下拉选项来自当前策略组名称，并附加 `DIRECT` 和 `REJECT`
  - 第一阶段固定插入到 `MATCH` 之前
- 通过 `onUpdateConfigContent` 触发 YAML 内容更新。

### `TemplateEditor`

`TemplateEditor` 保持现有头部、元信息编辑、校验错误展示和 YAML 编辑器。编辑模式下，编辑器主体改成响应式分栏布局：

- 桌面端左侧显示固定宽度的可视化工具栏。
- YAML 编辑器仍然占据主要编辑区域。
- 窄屏下，可视化工具堆叠在 YAML 编辑器上方。
- 只读模式下，可视化工具可以展示解析摘要，但变更控件需要禁用。

## 数据流

1. `TemplateEditor` 接收 `currentConfigContent`。
2. `TemplateVisualTools` 使用 `js-yaml` 解析该字符串。
3. 用户切换地区或提交网站规则。
4. 工具函数返回新的 YAML 字符串。
5. `TemplateEditor` 调用 `onUpdateConfigContent(newContent)`。
6. 现有校验和保存行为保持不变。

## 地区过滤行为

地区过滤作用于 `proxy-groups`，不是新增或修改 `GEOIP` 路由规则。

- 当策略组名称匹配某个地区的配置正则时，该组归属于该地区。
- `DIRECT`、`REJECT` 等内置 policy 永远不被当成可移除策略组。
- 引用已移除策略组的规则会被移除，行为与现有服务端过滤逻辑保持一致。
- `MATCH` 只有在它的 policy 仍然有效时才会保留。
- 空选择不会自动应用；UI 应要求至少选择一个地区后才能执行过滤。

## 网站规则行为

生成的规则行使用 Clash/mihomo 兼容的直接规则：

- `DOMAIN,example.com,Policy`
- `DOMAIN-SUFFIX,example.com,Policy`
- `DOMAIN-KEYWORD,google,Policy`

域名输入会做轻量归一化：去除首尾空白，并在可行时移除 URL scheme 和 path。重复生成的规则会跳过。新规则插入到第一个 `MATCH` 规则之前，以保留兜底规则的语义。

## 错误处理

- YAML 无效：禁用可视化变更控件，并提示需要先修复原始 YAML。
- 缺少 `proxy-groups`：显示空的地区状态，网站规则只允许选择内置 policy。
- 缺少 `rules`：新增网站规则时创建 `rules` 数组。
- 不支持或非字符串形式的 rule：默认保留；只有地区过滤时，如果它引用了已移除策略组，才会被清理。

## 测试

为 YAML 工具模块添加聚焦测试：

1. 能使用 `ProxyAreaObjects` 提取带地区归属的策略组。
2. 应用地区选择后，会移除指向被排除策略组的规则。
3. 新增网站规则会插入到 `MATCH` 前。
4. 重复网站规则会被跳过。
5. 无效 YAML 会返回解析错误状态。

如果现有测试环境支持轻量组件渲染测试，可以补充覆盖组件行为；否则第一阶段至少验证工具层，并运行 lint。

## 后续交互阶段

第一阶段稳定后，再讨论和设计：

1. 规则表格，支持编辑、删除、启用/禁用和排序。
2. rule-provider 创建，以及 `RULE-SET` 绑定。
3. 可视化变更应用前的 YAML diff 预览。
4. 可视化操作历史，用于撤销编辑。
5. 更完整的 Clash/mihomo 校验，覆盖 logical rules、sub-rules、端口、进程规则等边缘语法。
