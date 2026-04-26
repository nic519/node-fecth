# Visual-v1 Template Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增独立的 `visual-v1` 模板模型和编译器，让新模板可以用中间模型编辑并生成 Clash/Mihomo YAML，同时旧 `yaml` 模板逻辑保持不变。

**Architecture:** 第一阶段先实现纯 TypeScript 模型、compiler 和 fixture 测试，不改订阅接口读取方式。为了避免数据库迁移阻塞，最小闭环允许先把 `visual-v1` model 序列化进 `content` 的受控元数据块，并在保存时编译出 YAML；后续再把 `format` 和 `visual_model` 升级为独立数据库列。

**Tech Stack:** Next.js App Router、TypeScript、Bun test、`js-yaml`、现有 admin templates 页面和 API、Drizzle SQLite schema。

---

## File Structure

- Create: `src/app/admin/templates/visual-template/types.ts`
  - 定义 `VisualTemplateModel`、`Policy`、`PolicyRef`、`RuleSetRef`、`FilterPreset`、`UrlTestOptions` 和内置 policy。
- Create: `src/app/admin/templates/visual-template/compiler.ts`
  - 把 `VisualTemplateModel` 编译为 Clash/Mihomo YAML。
- Create: `src/app/admin/templates/visual-template/metadata.ts`
  - 第一阶段负责把 visual model 包装进/解析出 `content` 元数据块。
- Create: `src/app/admin/templates/visual-template/fixtures.ts`
  - 提供 WhatsApp、海外 AI、香港 url-test 等最小样例。
- Create: `tests/visual-template-compiler.test.ts`
  - 覆盖引用解析、filter 编译、`select`、`url-test`、`rules` 和 `rule-providers`。
- Modify: `src/types/schema.template.ts`
  - 扩展请求/响应类型以允许可选 `format`，短期不强依赖数据库列。
- Modify: `src/app/admin/templates/hooks/useTemplateManagement.ts`
  - 新建模板时支持 YAML 模板和 visual-v1 模板两种入口。
- Modify: `src/app/admin/templates/AdminTemplatesClient.tsx`
  - 在 UI 层展示新建入口和模板格式标识。

---

### Task 1: 定义 Visual-v1 类型

**Files:**
- Create: `src/app/admin/templates/visual-template/types.ts`

- [ ] **Step 1: 写类型文件**

Create `src/app/admin/templates/visual-template/types.ts`:

```ts
export type TemplateFormat = 'yaml' | 'visual-v1';

export type PolicyType = 'select' | 'url-test';

export type PolicyTag = 'app' | 'collection' | 'system' | 'region' | 'manual';

export interface VisualTemplateModel {
  version: 1;
  policies: Policy[];
  providerDefaults: RuleProviderDefaults;
  urlTestDefaults: UrlTestDefaults;
}

export interface Policy {
  id: string;
  title: string;
  compileName: string;
  type: PolicyType;
  tags?: PolicyTag[];
  proxies?: PolicyRef[];
  rules?: RuleSetRef[];
  includeAll?: boolean;
  includeAllProxies?: boolean;
  includeAllProviders?: boolean;
  filter?: FilterPreset;
  urlTest?: UrlTestOptions;
}

export interface PolicyRef {
  id: string;
}

export interface RuleSetRef {
  id: string;
  providerKey: string;
  behavior: 'domain' | 'ipcidr' | 'classical';
  format: 'mrs' | 'yaml' | 'text';
  url: string;
  noResolve?: boolean;
}

export interface FilterPreset {
  include?: string[];
  exclude?: string[];
  raw?: string;
}

export interface UrlTestOptions {
  url?: string;
  interval?: number;
  tolerance?: number;
  lazy?: boolean;
  timeout?: number;
  maxFailedTimes?: number;
  expectedStatus?: string;
}

export interface RuleProviderDefaults {
  type: 'http';
  interval: number;
}

export interface UrlTestDefaults {
  url?: string;
  interval: number;
  tolerance: number;
}

export interface BuiltinPolicy {
  id: string;
  compileName: string;
}

export const BUILTIN_POLICIES: BuiltinPolicy[] = [
  { id: 'direct', compileName: '🇨🇳 直连' },
  { id: 'reject', compileName: 'REJECT' },
];
```

- [ ] **Step 2: 运行类型检查**

Run: `bunx tsc --noEmit`

Expected: PASS. 新文件只导出类型和常量，不应影响现有运行时。

---

### Task 2: 编写 compiler 失败测试

**Files:**
- Create: `tests/visual-template-compiler.test.ts`
- Create: `src/app/admin/templates/visual-template/fixtures.ts`

- [ ] **Step 1: 写 fixture**

Create `src/app/admin/templates/visual-template/fixtures.ts`:

```ts
import type { VisualTemplateModel } from './types';

export const minimalVisualTemplateModel: VisualTemplateModel = {
  version: 1,
  providerDefaults: {
    type: 'http',
    interval: 86400,
  },
  urlTestDefaults: {
    interval: 200,
    tolerance: 23,
  },
  policies: [
    {
      id: 'auto-hk',
      title: '香港',
      compileName: '[自动]-香港🇭🇰',
      type: 'url-test',
      tags: ['region'],
      includeAll: true,
      filter: {
        include: ['港', 'HK', 'Hong', '🇭🇰'],
        exclude: ['1.5', '倍率:2'],
      },
      urlTest: {
        interval: 200,
        tolerance: 23,
      },
    },
    {
      id: 'foreign',
      title: '国外流量',
      compileName: '🚀 国外流量',
      type: 'select',
      tags: ['system'],
      proxies: [{ id: 'auto-hk' }, { id: 'direct' }],
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      compileName: '[单]-WhatsApp💬',
      type: 'select',
      tags: ['app'],
      proxies: [{ id: 'foreign' }, { id: 'direct' }],
      includeAll: true,
      filter: {
        include: ['台', 'TW', 'SG', 'JP', 'HK', '香港', '美'],
      },
      rules: [
        {
          id: 'whatsapp-domain',
          providerKey: 'whatsapp_domain',
          behavior: 'domain',
          format: 'mrs',
          url: 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/whatsapp.mrs',
        },
      ],
    },
  ],
};
```

- [ ] **Step 2: 写 compiler 测试**

Create `tests/visual-template-compiler.test.ts`:

```ts
import { expect, test } from 'bun:test';
import { compileVisualTemplate, compileFilter, resolvePolicyCompileName } from '@/app/admin/templates/visual-template/compiler';
import { minimalVisualTemplateModel } from '@/app/admin/templates/visual-template/fixtures';

test('compileFilter creates include and exclude regex', () => {
  expect(compileFilter({ include: ['港', 'HK'], exclude: ['1.5', '倍率:2'] })).toBe('(?=(港|HK))(?!.*(1\\.5|倍率:2))');
});

test('resolvePolicyCompileName resolves user and builtin policies', () => {
  expect(resolvePolicyCompileName({ id: 'auto-hk' }, minimalVisualTemplateModel)).toBe('[自动]-香港🇭🇰');
  expect(resolvePolicyCompileName({ id: 'direct' }, minimalVisualTemplateModel)).toBe('🇨🇳 直连');
});

test('compileVisualTemplate emits proxy-groups, rules, and providers', () => {
  const yaml = compileVisualTemplate(minimalVisualTemplateModel);

  expect(yaml).toContain('proxy-groups:');
  expect(yaml).toContain('name: "[自动]-香港🇭🇰"');
  expect(yaml).toContain('type: url-test');
  expect(yaml).toContain('filter: "(?=(港|HK|Hong|🇭🇰))(?!.*(1\\\\.5|倍率:2))"');
  expect(yaml).toContain('name: "[单]-WhatsApp💬"');
  expect(yaml).toContain('proxies: ["🚀 国外流量", "🇨🇳 直连"]');
  expect(yaml).toContain('RULE-SET,whatsapp_domain,[单]-WhatsApp💬');
  expect(yaml).toContain('rule-providers:');
  expect(yaml).toContain('whatsapp_domain:');
  expect(yaml).toContain('url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/whatsapp.mrs"');
});
```

- [ ] **Step 3: 验证测试失败**

Run: `bun test tests/visual-template-compiler.test.ts`

Expected: FAIL with module not found for `visual-template/compiler`.

---

### Task 3: 实现 Visual-v1 compiler

**Files:**
- Create: `src/app/admin/templates/visual-template/compiler.ts`
- Test: `tests/visual-template-compiler.test.ts`

- [ ] **Step 1: 实现 compiler**

Create `src/app/admin/templates/visual-template/compiler.ts`:

```ts
import yaml from 'js-yaml';
import {
  BUILTIN_POLICIES,
  type FilterPreset,
  type Policy,
  type PolicyRef,
  type RuleSetRef,
  type VisualTemplateModel,
} from './types';

type ClashConfig = Record<string, unknown>;

export function resolvePolicyCompileName(ref: PolicyRef, model: VisualTemplateModel): string {
  const policy = model.policies.find((item) => item.id === ref.id);
  if (policy) return policy.compileName;

  const builtin = BUILTIN_POLICIES.find((item) => item.id === ref.id);
  if (builtin) return builtin.compileName;

  throw new Error(`Unknown policy reference: ${ref.id}`);
}

export function compileFilter(filter?: FilterPreset): string | undefined {
  if (!filter) return undefined;
  if (filter.raw?.trim()) return filter.raw.trim();

  const include = normalizeKeywords(filter.include).map(escapeRegexKeyword);
  const exclude = normalizeKeywords(filter.exclude).map(escapeRegexKeyword);
  const includePart = include.length > 0 ? `(?=(${include.join('|')}))` : '';
  const excludePart = exclude.length > 0 ? `(?!.*(${exclude.join('|')}))` : '';
  const value = `${includePart}${excludePart}`;
  return value || undefined;
}

export function compileVisualTemplate(model: VisualTemplateModel): string {
  const proxyGroups = model.policies.map((policy) => compilePolicy(policy, model));
  const ruleSets = model.policies.flatMap((policy) => compileRules(policy));
  const providers = compileRuleProviders(model);

  const config: ClashConfig = {
    'proxy-groups': proxyGroups,
    rules: [...ruleSets, 'MATCH,🐟 漏网之鱼'],
    'rule-providers': providers,
  };

  return yaml.dump(config, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
  });
}

function compilePolicy(policy: Policy, model: VisualTemplateModel): Record<string, unknown> {
  const base: Record<string, unknown> = {
    name: policy.compileName,
    type: policy.type,
  };

  if (policy.type === 'select') {
    base.proxies = (policy.proxies ?? []).map((ref) => resolvePolicyCompileName(ref, model));
  }

  if (policy.includeAll) base['include-all'] = true;
  if (policy.includeAllProxies) base['include-all-proxies'] = true;
  if (policy.includeAllProviders) base['include-all-providers'] = true;

  const filter = compileFilter(policy.filter);
  if (filter) base.filter = filter;

  if (policy.type === 'url-test') {
    const options = { ...model.urlTestDefaults, ...policy.urlTest };
    if (options.url) base.url = options.url;
    if (options.interval !== undefined) base.interval = options.interval;
    if (options.tolerance !== undefined) base.tolerance = options.tolerance;
    if (options.lazy !== undefined) base.lazy = options.lazy;
    if (options.timeout !== undefined) base.timeout = options.timeout;
    if (options.maxFailedTimes !== undefined) base['max-failed-times'] = options.maxFailedTimes;
    if (options.expectedStatus) base['expected-status'] = options.expectedStatus;
  }

  return base;
}

function compileRules(policy: Policy): string[] {
  return (policy.rules ?? []).map((rule) => {
    const parts = ['RULE-SET', rule.providerKey, policy.compileName];
    if (rule.noResolve) parts.push('no-resolve');
    return parts.join(',');
  });
}

function compileRuleProviders(model: VisualTemplateModel): Record<string, unknown> {
  const providers: Record<string, unknown> = {};
  const seen = new Set<string>();
  for (const policy of model.policies) {
    for (const rule of policy.rules ?? []) {
      if (seen.has(rule.providerKey)) continue;
      seen.add(rule.providerKey);
      providers[rule.providerKey] = compileProvider(rule, model);
    }
  }
  return providers;
}

function compileProvider(rule: RuleSetRef, model: VisualTemplateModel): Record<string, unknown> {
  return {
    type: model.providerDefaults.type,
    interval: model.providerDefaults.interval,
    behavior: rule.behavior,
    format: rule.format,
    url: rule.url,
  };
}

function normalizeKeywords(keywords?: string[]): string[] {
  return Array.from(new Set((keywords ?? []).map((keyword) => keyword.trim()).filter(Boolean)));
}

function escapeRegexKeyword(keyword: string): string {
  return keyword.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}
```

- [ ] **Step 2: 验证 compiler 测试通过**

Run: `bun test tests/visual-template-compiler.test.ts`

Expected: PASS.

- [ ] **Step 3: 运行 compiler 与 legacy YAML 测试**

Run: `bun test tests/visual-template-compiler.test.ts tests/clash-template-utils.test.ts`

Expected: PASS.

---

### Task 4: 实现 visual-v1 content 元数据包装

**Files:**
- Create: `src/app/admin/templates/visual-template/metadata.ts`
- Test: `tests/visual-template-compiler.test.ts`

- [ ] **Step 1: 增加失败测试**

Append to `tests/visual-template-compiler.test.ts`:

```ts
import { extractVisualModelFromContent, wrapVisualModelContent } from '@/app/admin/templates/visual-template/metadata';

test('wrapVisualModelContent stores model and compiled yaml in one content string', () => {
  const content = wrapVisualModelContent(minimalVisualTemplateModel);
  const extracted = extractVisualModelFromContent(content);

  expect(content).toContain('# visual-v1:model:');
  expect(content).toContain('proxy-groups:');
  expect(extracted?.version).toBe(1);
  expect(extracted?.policies.find((policy) => policy.id === 'whatsapp')?.compileName).toBe('[单]-WhatsApp💬');
});
```

- [ ] **Step 2: 验证测试失败**

Run: `bun test tests/visual-template-compiler.test.ts`

Expected: FAIL because `visual-template/metadata` does not exist.

- [ ] **Step 3: 实现 metadata 包装**

Create `src/app/admin/templates/visual-template/metadata.ts`:

```ts
import { compileVisualTemplate } from './compiler';
import type { VisualTemplateModel } from './types';

const MODEL_PREFIX = '# visual-v1:model:';
const MODEL_END = '# visual-v1:end';

export function wrapVisualModelContent(model: VisualTemplateModel): string {
  const encoded = Buffer.from(JSON.stringify(model), 'utf8').toString('base64');
  return [MODEL_PREFIX, encoded, MODEL_END, compileVisualTemplate(model)].join('\n');
}

export function extractVisualModelFromContent(content: string): VisualTemplateModel | null {
  const lines = content.split('\n');
  const start = lines.findIndex((line) => line.trim() === MODEL_PREFIX);
  if (start === -1) return null;
  const end = lines.findIndex((line, index) => index > start && line.trim() === MODEL_END);
  if (end === -1) return null;
  const encoded = lines.slice(start + 1, end).join('').trim();
  if (!encoded) return null;

  try {
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as VisualTemplateModel;
  } catch {
    return null;
  }
}

export function isVisualTemplateContent(content: string): boolean {
  return extractVisualModelFromContent(content) !== null;
}
```

- [ ] **Step 4: 验证测试通过**

Run: `bun test tests/visual-template-compiler.test.ts`

Expected: PASS.

---

### Task 5: 扩展模板 API 类型

**Files:**
- Modify: `src/types/schema.template.ts`

- [ ] **Step 1: 扩展 schema**

Modify `ConfigTemplateSchema`:

```ts
export const ConfigTemplateSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string(),
  description: z.string(),
  content: z.string(),
  format: z.enum(['yaml', 'visual-v1']).optional().default('yaml'),
  createdAt: z.string(),
  updatedAt: z.string(),
});
```

Modify `ConfigTemplateSaveRequestSchema`:

```ts
export const ConfigTemplateSaveRequestSchema = z.object({
  name: z.string().min(1, '模板名称不能为空'),
  description: z.string(),
  content: z.string().min(1, '模板内容不能为空'),
  format: z.enum(['yaml', 'visual-v1']).optional().default('yaml'),
});
```

- [ ] **Step 2: 运行 admin auth 测试**

Run: `bun test tests/admin-pages-auth.test.tsx`

Expected: PASS. API 响应没有 `format` 时，前端类型默认按 `yaml` 处理。

---

### Task 6: 新建 visual-v1 模板入口

**Files:**
- Modify: `src/app/admin/templates/hooks/useTemplateManagement.ts`
- Modify: `src/app/admin/templates/AdminTemplatesClient.tsx`

- [ ] **Step 1: 在 hook 中新增创建方法**

Modify `useTemplateManagement.ts` to import fixtures and metadata:

```ts
import { minimalVisualTemplateModel } from '../visual-template/fixtures';
import { wrapVisualModelContent } from '../visual-template/metadata';
```

Add a new handler beside `handleCreateTemplate`:

```ts
const handleCreateVisualTemplate = async () => {
  setLoading(true);
  setError(null);

  try {
    const response = await templateApi.createTemplate({
      name: '新可视化模板',
      description: 'visual-v1',
      content: wrapVisualModelContent(minimalVisualTemplateModel),
      format: 'visual-v1',
    });

    if (response.code !== ResponseCodes.SUCCESS) {
      throw new Error(response.msg || '创建模板失败');
    }

    setTemplates((prev) => [
      ...prev.map((template) => ({ ...template, isSelected: false })),
      {
        ...response.data.template,
        configContent: response.data.template.content || '',
        isSelected: true,
      },
    ]);
    setIsEditing(true);
  } catch (err) {
    setError(err instanceof Error ? err.message : '创建模板失败');
  } finally {
    setLoading(false);
  }
};
```

Return `handleCreateVisualTemplate` from the hook.

- [ ] **Step 2: 在 AdminTemplatesClient 增加按钮**

In `AdminTemplatesClient.tsx`, destructure `handleCreateVisualTemplate`.

In the sidebar action area, replace the single action with two buttons:

```tsx
<div className="flex gap-2">
  <Button onClick={handleCreateTemplate} size="sm" className="h-8 px-3 text-xs">
    <Plus className="w-3.5 h-3.5 mr-1.5" />
    YAML
  </Button>
  <Button onClick={handleCreateVisualTemplate} size="sm" variant="secondary" className="h-8 px-3 text-xs">
    可视化
  </Button>
</div>
```

- [ ] **Step 3: 运行类型检查**

Run: `bunx tsc --noEmit`

Expected: PASS.

---

### Task 7: 在 UI 中识别 visual-v1 内容

**Files:**
- Modify: `src/app/admin/templates/components/TemplateEditor.tsx`
- Modify: `src/app/admin/templates/components/TemplateVisualTools.tsx`

- [ ] **Step 1: 显示模板格式标识**

In `TemplateEditor.tsx`, import:

```ts
import { isVisualTemplateContent } from '../visual-template/metadata';
```

Compute:

```ts
const isVisualTemplate = isVisualTemplateContent(currentConfigContent);
```

Near the title, render:

```tsx
<span className="inline-flex w-fit rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
  {isVisualTemplate ? '可视化模板' : 'YAML 模板'}
</span>
```

- [ ] **Step 2: 对 visual-v1 暂时显示 YAML 预览**

Keep existing `YamlEditor` as the right-side preview/editor in first implementation. Do not yet build a full model editor in this task.

- [ ] **Step 3: 运行浏览器检查**

Open `http://localhost:3555/admin/templates?superToken=123`, create a visual template, verify:

- sidebar shows a visual template creation option
- created template content contains `# visual-v1:model:`
- editor shows `可视化模板`
- subscription endpoint for that template returns YAML content

---

### Task 8: Full Verification

**Files:**
- Modify only if verification reveals issues in touched files

- [ ] **Step 1: Run all related tests**

Run:

```bash
bun test tests/visual-template-compiler.test.ts tests/clash-template-utils.test.ts tests/admin-pages-auth.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run:

```bash
bunx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Run lint**

Run:

```bash
bun run lint
```

Expected: no errors. Existing repository warnings may remain.

- [ ] **Step 4: Browser smoke test**

Use the running dev server or start it with `bun run dev`. Open:

```text
http://localhost:3555/admin/templates?superToken=123
```

Verify:

- old YAML templates still open normally
- new visual template can be created
- visual template content compiles to YAML
- no console errors

---

## Self-Review

- Spec coverage: This plan covers model types, compiler, content wrapping, creation entry, template format labeling, old-template isolation, and verification.
- Scope: This plan intentionally does not implement the full visual model editor. It creates the compile and storage foundation first.
- 空洞内容扫描：计划未留下开放式占位任务，并提供了明确文件、命令、预期结果和代码骨架。
- Type consistency: The plan consistently uses `VisualTemplateModel`, `Policy`, `PolicyRef`, `RuleSetRef`, `FilterPreset`, `UrlTestOptions`, `TemplateFormat`, and `visual-v1`.
