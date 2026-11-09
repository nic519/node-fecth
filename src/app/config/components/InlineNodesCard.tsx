import { ListTree } from 'lucide-react';
import { parseInlineProxies } from '@/modules/user/inline-proxies';
import type { SubConfig } from '@/types/user-config';

export function InlineNodesCard({ item }: { item: SubConfig }) {
    let nodes: ReturnType<typeof parseInlineProxies> = [];
    let error = '';
    try {
        nodes = parseInlineProxies(item.proxiesYaml ?? '');
    } catch {
        error = item.proxiesYaml?.trim()
            ? '节点列表暂无法解析，请到基础配置检查节点内容并保存。'
            : '尚未粘贴节点，请到基础配置添加节点并保存。';
    }

    const protocols = new Map<string, number>();
    for (const node of nodes) {
        const protocol = node.type.toUpperCase();
        protocols.set(protocol, (protocols.get(protocol) ?? 0) + 1);
    }

    return (
        <section aria-label={`${item.flag ? `${item.flag} ` : ''}直接节点列表`} className="min-w-0 overflow-hidden rounded-xl border border-border/70">
            <div className="flex flex-wrap items-center gap-3 bg-muted/30 px-4 py-3 sm:px-5">
                <ListTree aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
                <h3 className="min-w-0 break-words text-sm font-medium">
                    {item.flag && <span className="mr-2">{item.flag}</span>}
                    直接节点列表
                </h3>
                <span className="ml-auto shrink-0 rounded-md border border-border/70 px-2 py-0.5 text-xs text-muted-foreground">手动更新</span>
            </div>

            <div className="space-y-4 px-4 py-4 sm:px-5">
                {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : (
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <p className="text-sm"><span className="text-2xl font-semibold tabular-nums">{nodes.length}</span> 个节点</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {Array.from(protocols, ([protocol, count]) => (
                                <span key={protocol}>{protocol} <span className="tabular-nums">{count}</span></span>
                            ))}
                        </div>
                    </div>
                )}

                <p className="text-xs leading-5 text-muted-foreground">
                    直接使用粘贴的节点，无需远程同步。更新节点请到基础配置重新粘贴并保存；此来源不支持自动获取流量与到期信息。
                </p>

                {nodes.length > 0 && (
                    <details className="border-t border-border/60 pt-3">
                        <summary className="cursor-pointer rounded-sm text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            查看节点名称与协议
                        </summary>
                        <ul aria-label="节点名称与协议" tabIndex={0} className="mt-3 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto overscroll-contain rounded-sm lg:grid-cols-3 xl:grid-cols-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            {nodes.map((node) => (
                                <li key={node.name} className="min-w-0 rounded-md border border-border/50 bg-muted/20 px-2.5 py-2">
                                    <p title={node.name} className="truncate text-xs font-medium leading-4">{node.name}</p>
                                    <p className="mt-1 text-[10px] leading-3 text-muted-foreground">{node.type.toUpperCase()}</p>
                                </li>
                            ))}
                        </ul>
                    </details>
                )}
            </div>
        </section>
    );
}
