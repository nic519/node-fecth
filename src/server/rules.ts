import 'server-only';

import yaml from 'js-yaml';

export async function fetchRuleFilterOptions(url: string): Promise<string[]> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('获取规则失败');
  }

  const text = await response.text();
  const data = yaml.load(text) as unknown;

  if (data && typeof data === 'object' && 'proxy-groups' in data && Array.isArray((data as { ['proxy-groups']?: unknown })['proxy-groups'])) {
    const proxyGroups = (data as { ['proxy-groups']?: { name?: string }[] })['proxy-groups'] ?? [];
    const options = proxyGroups
      .map((group) => group.name)
      .filter((name): name is string => Boolean(name));

    return [...new Set(options)];
  }

  throw new Error('YAML 格式错误: 缺少 proxy-groups');
}
