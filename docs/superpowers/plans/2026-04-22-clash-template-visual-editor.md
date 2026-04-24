# Clash 模板可视化编辑器实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 在不改变模板存储/读取逻辑的前提下，把管理员模板编辑器的可视化交互收敛到 `proxy-groups` 配置。

**Architecture:** YAML 文本仍然是唯一事实来源。`clash-template-utils` 负责解析、摘要和文本级字段写回；`TemplateVisualTools` 负责按策略组类型展示编辑控件；`TemplateEditor` 只负责把可视化工具接到现有 `onUpdateConfigContent`。

**Tech Stack:** Next.js App Router、React Client Components、TypeScript、Bun test、`js-yaml`、现有 shadcn/Radix UI 组件、Tailwind CSS。

---

### Task 1: YAML 工具层

**Files:**
- Create: `src/app/admin/templates/utils/clash-template-utils.ts`
- Test: `tests/clash-template-utils.test.ts`

- [x] **Step 1: 写失败测试**

覆盖无效 YAML、策略组摘要、filter 预设拆解、filter 写回和 anchors 保留。

- [x] **Step 2: 实现解析与摘要**

实现 `parseClashTemplate`、`extractProxyGroupSummaries`、`extractFilterPresets`、`buildFilterFromKeywords`。

- [x] **Step 3: 实现写回**

实现 `applyProxyGroupFilter` 和 `applyProxyGroupOptions`，写回时优先文本级替换，避免展开 `&country_pr`、`*country_pr`。

- [x] **Step 4: 验证工具测试**

Run: `bun test tests/clash-template-utils.test.ts`
Expected: PASS.

### Task 2: 可视化工具组件

**Files:**
- Create: `src/app/admin/templates/components/TemplateVisualTools.tsx`

- [x] **Step 1: 实现策略组选择与摘要**

显示 YAML 解析状态、策略组数量、filter 数量、当前组类型、`proxies/use` 数量和候选预览。

- [x] **Step 2: 实现按类型编辑**

`select` 展示候选来源和通用筛选字段；`url-test` 展示健康检查和 `tolerance`；`fallback` 展示健康检查；`load-balance` 展示 `strategy`。

- [x] **Step 3: 实现 filter 可视化与复用**

当前策略组可编辑“包含/排除/原始 filter”；复用区选择来源 filter，目标默认为当前策略组。

- [x] **Step 4: 实现输入保护**

数值字段在写回前校验，避免把非数字写成 `NaN`。

### Task 3: 接入模板编辑器

**Files:**
- Modify: `src/app/admin/templates/components/TemplateEditor.tsx`

- [x] **Step 1: 导入并渲染 `TemplateVisualTools`**

编辑器主体改成桌面双栏、窄屏堆叠。

- [x] **Step 2: 保持现有原始编辑器能力**

`YamlEditor` 仍使用原来的 `currentConfigContent`、`onUpdateConfigContent`、`onValidate`、`readOnly`。

- [x] **Step 3: 处理滚动条**

新增可滚动面板使用 `custom-scrollbar`。

### Task 4: 文档同步

**Files:**
- Modify: `docs/superpowers/specs/2026-04-22-clash-template-visual-editor-design.md`

- [x] **Step 1: 用中文更新 spec**

记录 `proxy-groups` 字段范围、按 type 的编辑策略、filter 复用行为和 `proxies/use` 暂缓编辑的原因。

### Task 5: 验证

**Files:**
- Modify only if needed: files touched above

- [x] **Step 1: 运行相关测试**

Run: `bun test tests/admin-pages-auth.test.tsx tests/clash-template-utils.test.ts`
Expected: PASS.

- [x] **Step 2: 运行类型检查**

Run: `bunx tsc --noEmit`
Expected: PASS.

- [x] **Step 3: 运行 lint**

Run: `bun run lint`
Expected: no errors; current repository has pre-existing warnings.

- [x] **Step 4: 浏览器检查**

打开 `http://localhost:3555/admin/templates?superToken=123`，确认可视化工具渲染、`url-test` 字段按类型显示、控制台无错误。

### Task 6: 三列编辑与规则关联

**Files:**
- Modify: `src/app/admin/templates/AdminTemplatesClient.tsx`
- Modify: `src/app/admin/templates/components/TemplateVisualTools.tsx`
- Modify: `src/app/admin/templates/utils/clash-template-utils.ts`
- Test: `tests/clash-template-utils.test.ts`

- [x] **Step 1: 增加规则关联测试**

覆盖 `RULE-SET,cursor_domain,[单]-Cursor🐶` 能关联到 `rule-providers.cursor_domain.url`。

- [x] **Step 2: 实现规则关联提取**

`extractProxyGroupSummaries` 增加 `ruleAssociations` 字段。

- [x] **Step 3: 拆分左侧分组目录和中间编辑区**

`TemplateVisualTools` 改为左侧目录按 `Select 策略` 和 `URL-Test 自动组` 分组列出 item，中间只显示当前 item 的编辑内容，右侧保留 YAML。

- [x] **Step 4: 编辑态隐藏模板列表**

`AdminTemplatesClient` 在 `isEditing` 时不渲染外层模板列表，主编辑器使用更宽的页面容器。

- [x] **Step 5: 验证**

Run: `bun test tests/admin-pages-auth.test.tsx tests/clash-template-utils.test.ts && bunx tsc --noEmit && bun run lint`
Expected: tests and typecheck pass; lint has no new errors.
