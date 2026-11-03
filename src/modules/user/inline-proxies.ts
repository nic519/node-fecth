import yaml from 'js-yaml';
import { z } from 'zod';

const ProxySchema = z.object({
  name: z.string().trim().min(1),
  type: z.string().trim().min(1),
  server: z.string().min(1).optional(),
  port: z.number().int().min(1).max(65535).optional(),
}).passthrough().refine(node =>
  ['direct', 'reject'].includes(node.type) || (node.server !== undefined && node.port !== undefined),
);

export function parseInlineProxies(content: string) {
  if (content.length > 1_000_000) throw new Error('节点 YAML 不能超过 100 万字符');
  let document: unknown;
  try {
    document = yaml.load(content, { schema: yaml.JSON_SCHEMA });
  } catch {
    throw new Error('YAML 格式错误，请检查缩进和标点');
  }
  const nodes = Array.isArray(document) ? document
    : document && typeof document === 'object' && 'proxies' in document ? document.proxies : undefined;
  const result = z.array(ProxySchema).min(1).safeParse(nodes);
  if (!result.success) throw new Error('请粘贴非空 proxies 节点列表，节点需包含 name、type，以及服务器地址和端口');
  const names = result.data.map(node => node.name);
  if (new Set(names).size !== names.length) throw new Error('节点名称不能重复');
  return result.data;
}

export function normalizeInlineProxies(content: string): string {
  return yaml.dump({ proxies: parseInlineProxies(content) });
}
