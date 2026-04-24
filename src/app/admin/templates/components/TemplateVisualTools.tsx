'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
	applyProxyGroupFilter,
	applyProxyGroupOptions,
	buildFilterFromKeywords,
	extractFilterPresets,
	extractProxyGroupSummaries,
	parseClashTemplate,
	type ProxyGroupOptionKey,
	type ProxyGroupOptionValue,
	type ProxyGroupSummary,
} from '../utils/clash-template-utils';
import { Activity, GitBranch, Route, Save, ShieldAlert } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';

interface TemplateVisualToolsProps {
	content: string;
	readOnly: boolean;
	onChange: (content: string) => void;
	onRevealProxyGroup?: (groupName: string) => void;
}

type DraftValues = Partial<Record<ProxyGroupOptionKey, string | boolean>>;
type WorkspaceType = 'select' | 'url-test';

export function TemplateVisualTools({ content, readOnly, onChange, onRevealProxyGroup }: TemplateVisualToolsProps) {
	const parsed = useMemo(() => parseClashTemplate(content), [content]);
	const summaries = useMemo(() => (parsed.ok ? extractProxyGroupSummaries(parsed) : []), [parsed]);
	const filterPresets = useMemo(() => (parsed.ok ? extractFilterPresets(parsed) : []), [parsed]);
	const selectGroups = summaries.filter((group) => group.type === 'select');
	const urlTestGroups = summaries.filter((group) => group.type === 'url-test');
	const [activeType, setActiveType] = useState<WorkspaceType>('select');
	const [activeSelectName, setActiveSelectName] = useState('');
	const [activeUrlTestName, setActiveUrlTestName] = useState('');
	const [filterDraftSource, setFilterDraftSource] = useState('');
	const [includeInput, setIncludeInput] = useState('');
	const [excludeInput, setExcludeInput] = useState('');
	const [rawFilter, setRawFilter] = useState('');
	const [optionDraftGroup, setOptionDraftGroup] = useState('');
	const [optionDraft, setOptionDraft] = useState<DraftValues>({});
	const [message, setMessage] = useState<string | null>(null);

	const canMutate = parsed.ok && !readOnly;
	const activeSelectGroup = selectGroups.find((group) => group.name === activeSelectName) ?? selectGroups[0] ?? null;
	const activeUrlTestGroup = urlTestGroups.find((group) => group.name === activeUrlTestName) ?? urlTestGroups[0] ?? null;
	const activeGroup = activeType === 'select' ? activeSelectGroup : activeUrlTestGroup;
	const filterState = activeGroup ? getFilterState(activeGroup) : null;

	function getFilterState(group: ProxyGroupSummary) {
		const preset = filterPresets.find((item) => item.groupName === group.name);
		const isDraft = filterDraftSource === group.name;
		return {
			canVisualize: Boolean(preset?.canVisualize),
			includeInput: isDraft ? includeInput : preset?.includeKeywords.join(', ') ?? '',
			excludeInput: isDraft ? excludeInput : preset?.excludeKeywords.join(', ') ?? '',
			rawFilter: isDraft ? rawFilter : preset?.filter ?? group.filter,
		};
	}

	const clearDrafts = () => {
		setFilterDraftSource('');
		setIncludeInput('');
		setExcludeInput('');
		setRawFilter('');
		setOptionDraftGroup('');
		setOptionDraft({});
		setMessage(null);
	};

	const handleGroupSelect = (type: WorkspaceType, groupName: string) => {
		setActiveType(type);
		if (type === 'select') setActiveSelectName(groupName);
		else setActiveUrlTestName(groupName);
		onRevealProxyGroup?.(groupName);
		clearDrafts();
	};

	const handleOptionChange = (group: ProxyGroupSummary, key: ProxyGroupOptionKey, value: string | boolean) => {
		setOptionDraftGroup(group.name);
		setOptionDraft((current) => ({ ...(optionDraftGroup === group.name ? current : {}), [key]: value }));
		setMessage(null);
	};

	const handleFilterKeywordChange = (group: ProxyGroupSummary, kind: 'include' | 'exclude', value: string) => {
		const current = getFilterState(group);
		const includeValue = kind === 'include' ? value : current.includeInput;
		const excludeValue = kind === 'exclude' ? value : current.excludeInput;
		const nextRaw = buildFilterFromKeywords({
			includeKeywords: splitKeywordInput(includeValue),
			excludeKeywords: splitKeywordInput(excludeValue),
		});

		setFilterDraftSource(group.name);
		setIncludeInput(includeValue);
		setExcludeInput(excludeValue);
		setRawFilter(nextRaw);
		setMessage(null);
	};

	const handleRawFilterChange = (group: ProxyGroupSummary, value: string) => {
		setFilterDraftSource(group.name);
		setRawFilter(value);
		setMessage(null);
	};

	const handleSaveGroup = (group: ProxyGroupSummary) => {
		let nextContent = content;
		const currentFilterState = getFilterState(group);
		if (filterDraftSource === group.name || currentFilterState.rawFilter !== group.filter) {
			const filterResult = applyProxyGroupFilter(nextContent, group.name, currentFilterState.rawFilter);
			if (!filterResult.ok) {
				setMessage(filterResult.error);
				return;
			}
			nextContent = filterResult.content;
		}

		const optionMutation = buildOptionMutation(group, optionDraftGroup, optionDraft);
		if (!optionMutation.ok) {
			setMessage(optionMutation.error);
			return;
		}
		const optionResult = applyProxyGroupOptions(nextContent, group.name, optionMutation.value);
		if (!optionResult.ok) {
			setMessage(optionResult.error);
			return;
		}

		onChange(optionResult.content);
		setMessage(optionResult.changed || nextContent !== content ? `已更新 ${group.name}` : '内容未发生变化');
		clearDrafts();
	};

	if (!parsed.ok) {
		return (
			<aside className="max-h-[42vh] min-h-0 border-b border-border/40 bg-background/70 lg:h-full lg:max-h-none lg:w-[660px] lg:shrink-0 lg:border-b-0 lg:border-r">
				<div className="h-full overflow-y-auto custom-scrollbar p-4">
					<div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
						<div className="mb-1 flex items-center gap-1.5 font-medium">
							<ShieldAlert className="h-3.5 w-3.5" />
							YAML 需要先修复
						</div>
						<p className="leading-relaxed">{parsed.error}</p>
					</div>
				</div>
			</aside>
		);
	}

	return (
		<aside className="max-h-[46vh] min-h-0 border-b border-border/40 bg-background/70 lg:h-full lg:max-h-none lg:w-[720px] lg:shrink-0 lg:border-b-0 lg:border-r">
			<div className="grid h-full min-h-0 grid-cols-1 overflow-y-auto custom-scrollbar lg:grid-cols-[260px_minmax(0,1fr)] lg:overflow-hidden">
				<nav className="min-h-0 border-b border-border/50 lg:border-b-0 lg:border-r">
					<div className="h-full overflow-y-auto custom-scrollbar p-3">
						<GroupListSection
							title="Select 策略"
							description="应用/类别策略"
							icon={<Route className="h-4 w-4" />}
							groups={selectGroups}
							activeName={activeType === 'select' ? activeGroup?.name : ''}
							onSelect={(groupName) => handleGroupSelect('select', groupName)}
						/>
						<GroupListSection
							title="URL-Test 自动组"
							description="测速筛选"
							icon={<Activity className="h-4 w-4" />}
							groups={urlTestGroups}
							activeName={activeType === 'url-test' ? activeGroup?.name : ''}
							onSelect={(groupName) => handleGroupSelect('url-test', groupName)}
							className="mt-4"
						/>
					</div>
				</nav>

				<section className="min-h-[420px] overflow-y-auto custom-scrollbar p-5 text-sm">
					{activeGroup && filterState ? (
						<GroupEditor
							group={activeGroup}
							readOnly={!canMutate}
							filterState={filterState}
							optionDraftGroup={optionDraftGroup}
							optionDraft={optionDraft}
							message={message}
							onOptionChange={handleOptionChange}
							onFilterKeywordChange={handleFilterKeywordChange}
							onRawFilterChange={handleRawFilterChange}
							onSave={handleSaveGroup}
						/>
					) : (
						<div className="text-xs text-muted-foreground">请选择一个策略组。</div>
					)}
				</section>
			</div>
		</aside>
	);
}

function GroupListSection({
	title,
	description,
	icon,
	groups,
	activeName,
	onSelect,
	className,
}: {
	title: string;
	description: string;
	icon: React.ReactNode;
	groups: ProxyGroupSummary[];
	activeName?: string;
	onSelect: (groupName: string) => void;
	className?: string;
}) {
	return (
		<section className={className}>
			<div className="mb-2 flex items-center justify-between gap-2 px-1">
				<div className="flex min-w-0 items-center gap-2">
					<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
						{icon}
					</div>
					<div className="min-w-0">
						<h4 className="truncate text-base font-semibold text-foreground">{title}</h4>
						<p className="truncate text-xs text-muted-foreground">{description}</p>
					</div>
				</div>
				<Badge variant="secondary" className="rounded-md text-[10px] font-normal">
					{groups.length}
				</Badge>
			</div>
			<div className="space-y-1">
				{groups.map((group) => (
					<button
						key={group.name}
						type="button"
						onClick={() => onSelect(group.name)}
						className={cn(
							'w-full rounded-md px-3 py-2.5 text-left text-sm transition-colors',
							activeName === group.name
								? 'bg-primary/10 text-primary'
								: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
						)}
					>
						<div className="truncate font-medium">{group.name}</div>
						<div className="mt-1 flex items-center gap-2 text-xs opacity-80">
							<span>{group.proxies.length || group.proxyCount} proxies</span>
							{group.ruleAssociations.length > 0 && <span>{group.ruleAssociations.length} rules</span>}
							{group.filter && <span>filter</span>}
						</div>
					</button>
				))}
			</div>
		</section>
	);
}

function GroupEditor({
	group,
	readOnly,
	filterState,
	optionDraftGroup,
	optionDraft,
	message,
	onOptionChange,
	onFilterKeywordChange,
	onRawFilterChange,
	onSave,
}: {
	group: ProxyGroupSummary;
	readOnly: boolean;
	filterState: { canVisualize: boolean; includeInput: string; excludeInput: string; rawFilter: string };
	optionDraftGroup: string;
	optionDraft: DraftValues;
	message: string | null;
	onOptionChange: (group: ProxyGroupSummary, key: ProxyGroupOptionKey, value: string | boolean) => void;
	onFilterKeywordChange: (group: ProxyGroupSummary, kind: 'include' | 'exclude', value: string) => void;
	onRawFilterChange: (group: ProxyGroupSummary, value: string) => void;
	onSave: (group: ProxyGroupSummary) => void;
}) {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<div className="flex items-center justify-between gap-3">
					<h5 className="min-w-0 truncate text-base font-semibold text-foreground">{group.name}</h5>
					<Badge variant="outline" className="rounded-md text-[10px]">
						{group.type}
					</Badge>
				</div>
				<div className="grid grid-cols-2 gap-2 text-sm">
					<FieldPill label="proxies" value={group.proxyCount || group.proxies.length} />
					<FieldPill label="use" value={group.use.length} />
				</div>
				{group.proxies.length > 0 && (
					<p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
						候选：{group.proxies.slice(0, 6).join(' / ')}
						{group.proxies.length > 6 ? ' / ...' : ''}
					</p>
				)}
			</div>

			{group.type === 'select' ? (
				<SelectFields group={group} readOnly={readOnly} optionDraftGroup={optionDraftGroup} optionDraft={optionDraft} onOptionChange={onOptionChange} />
			) : (
				<UrlTestFields group={group} readOnly={readOnly} optionDraftGroup={optionDraftGroup} optionDraft={optionDraft} onOptionChange={onOptionChange} />
			)}

			<FilterFields
				group={group}
				readOnly={readOnly}
				filterState={filterState}
				onFilterKeywordChange={onFilterKeywordChange}
				onRawFilterChange={onRawFilterChange}
			/>

			<Button type="button" onClick={() => onSave(group)} disabled={readOnly} className="h-9 w-full" variant="secondary">
				<Save className="mr-2 h-4 w-4" />
				保存这个策略组
			</Button>

			{message && (
				<div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
					{message}
				</div>
			)}
		</div>
	);
}

function SelectFields({
	group,
	readOnly,
	optionDraftGroup,
	optionDraft,
	onOptionChange,
}: {
	group: ProxyGroupSummary;
	readOnly: boolean;
	optionDraftGroup: string;
	optionDraft: DraftValues;
	onOptionChange: (group: ProxyGroupSummary, key: ProxyGroupOptionKey, value: string | boolean) => void;
}) {
	return (
		<div className="space-y-3">
			<div className="space-y-2">
				<div className="flex items-center gap-2 text-sm font-medium text-foreground">
					<GitBranch className="h-3.5 w-3.5 text-primary" />
					规则关联
				</div>
				{group.ruleAssociations.length === 0 ? (
					<div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
						没有发现指向这个 select 组的 RULE-SET。
					</div>
				) : (
					<div className="space-y-2">
						{group.ruleAssociations.map((rule) => (
							<div key={rule.ruleSet} className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
								<div className="text-sm font-medium text-foreground">{rule.ruleSet}</div>
								<div className="mt-1 break-all font-mono text-xs leading-relaxed text-muted-foreground">
									{rule.providerUrl || '未找到 rule-provider.url'}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			<CommonFields group={group} readOnly={readOnly} optionDraftGroup={optionDraftGroup} optionDraft={optionDraft} onOptionChange={onOptionChange} />
		</div>
	);
}

function UrlTestFields({
	group,
	readOnly,
	optionDraftGroup,
	optionDraft,
	onOptionChange,
}: {
	group: ProxyGroupSummary;
	readOnly: boolean;
	optionDraftGroup: string;
	optionDraft: DraftValues;
	onOptionChange: (group: ProxyGroupSummary, key: ProxyGroupOptionKey, value: string | boolean) => void;
}) {
	return (
		<div className="space-y-2">
			<LabeledInput
				label="url"
				help="健康检查地址；url-test 会用它判断节点是否可用。"
				value={draftValue(group, optionDraftGroup, optionDraft, 'url', group.url)}
				disabled={readOnly}
				onChange={(value) => onOptionChange(group, 'url', value)}
			/>
			<div className="grid grid-cols-2 gap-2">
				<LabeledInput label="interval" help="定期测速间隔，单位秒；0 表示不周期测速。" value={draftValue(group, optionDraftGroup, optionDraft, 'interval', group.interval)} disabled={readOnly} onChange={(value) => onOptionChange(group, 'interval', value)} />
				<LabeledInput label="tolerance" help="延迟差小于这个毫秒值时，尽量不频繁切换节点。" value={draftValue(group, optionDraftGroup, optionDraft, 'tolerance', group.tolerance)} disabled={readOnly} onChange={(value) => onOptionChange(group, 'tolerance', value)} />
			</div>
			<div className="grid grid-cols-2 gap-2">
				<LabeledInput label="timeout" help="健康检查超时时间，单位毫秒。" value={draftValue(group, optionDraftGroup, optionDraft, 'timeout', group.timeout)} disabled={readOnly} onChange={(value) => onOptionChange(group, 'timeout', value)} />
				<LabeledInput label="max failed" help="失败次数超过该值后，触发强制健康检查。" value={draftValue(group, optionDraftGroup, optionDraft, 'maxFailedTimes', group.maxFailedTimes)} disabled={readOnly} onChange={(value) => onOptionChange(group, 'maxFailedTimes', value)} />
			</div>
			<LabeledSwitch label="lazy" help="开启时，当前策略组未被选中就不主动测速。" checked={draftBool(group, optionDraftGroup, optionDraft, 'lazy', group.lazy ?? true)} disabled={readOnly} onCheckedChange={(value) => onOptionChange(group, 'lazy', value)} />
			<CommonFields group={group} readOnly={readOnly} optionDraftGroup={optionDraftGroup} optionDraft={optionDraft} onOptionChange={onOptionChange} />
		</div>
	);
}

function CommonFields({
	group,
	readOnly,
	optionDraftGroup,
	optionDraft,
	onOptionChange,
}: {
	group: ProxyGroupSummary;
	readOnly: boolean;
	optionDraftGroup: string;
	optionDraft: DraftValues;
	onOptionChange: (group: ProxyGroupSummary, key: ProxyGroupOptionKey, value: string | boolean) => void;
}) {
	return (
		<div className="space-y-2">
			<div className="grid grid-cols-2 gap-2">
				<LabeledSwitch label="include-all" help="把所有出站节点和 proxy-provider 节点加入候选；不包含其他策略组。" checked={draftBool(group, optionDraftGroup, optionDraft, 'includeAll', group.includeAll)} disabled={readOnly} onCheckedChange={(value) => onOptionChange(group, 'includeAll', value)} />
				<LabeledSwitch label="hidden" help="通过 API 标记为隐藏；是否真的隐藏取决于前端面板支持。" checked={draftBool(group, optionDraftGroup, optionDraft, 'hidden', group.hidden)} disabled={readOnly} onCheckedChange={(value) => onOptionChange(group, 'hidden', value)} />
			</div>
			<div className="grid grid-cols-2 gap-2">
				<LabeledSwitch label="all proxies" help="只加入配置里直接声明的出站节点；不包含 provider。" checked={draftBool(group, optionDraftGroup, optionDraft, 'includeAllProxies', group.includeAllProxies)} disabled={readOnly} onCheckedChange={(value) => onOptionChange(group, 'includeAllProxies', value)} />
				<LabeledSwitch label="all providers" help="只加入所有 proxy-provider 的节点；会覆盖 use 指定的 provider 范围。" checked={draftBool(group, optionDraftGroup, optionDraft, 'includeAllProviders', group.includeAllProviders)} disabled={readOnly} onCheckedChange={(value) => onOptionChange(group, 'includeAllProviders', value)} />
			</div>
			<LabeledInput label="exclude-filter" help="从自动纳入的候选里排除匹配关键词或正则的节点。" value={draftValue(group, optionDraftGroup, optionDraft, 'excludeFilter', group.excludeFilter)} disabled={readOnly} onChange={(value) => onOptionChange(group, 'excludeFilter', value)} />
			<div className="grid grid-cols-2 gap-2">
				<LabeledInput label="exclude-type" help="按节点类型排除，如 Http；用 | 分隔，不支持正则。" value={draftValue(group, optionDraftGroup, optionDraft, 'excludeType', group.excludeType)} disabled={readOnly} onChange={(value) => onOptionChange(group, 'excludeType', value)} />
				<LabeledInput label="icon" help="提供给前端面板显示的图标地址或标识。" value={draftValue(group, optionDraftGroup, optionDraft, 'icon', group.icon)} disabled={readOnly} onChange={(value) => onOptionChange(group, 'icon', value)} />
			</div>
		</div>
	);
}

function FilterFields({
	group,
	readOnly,
	filterState,
	onFilterKeywordChange,
	onRawFilterChange,
}: {
	group: ProxyGroupSummary;
	readOnly: boolean;
	filterState: { canVisualize: boolean; includeInput: string; excludeInput: string; rawFilter: string };
	onFilterKeywordChange: (group: ProxyGroupSummary, kind: 'include' | 'exclude', value: string) => void;
	onRawFilterChange: (group: ProxyGroupSummary, value: string) => void;
}) {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between gap-3">
				<Label className="text-xs font-medium text-foreground">Filter</Label>
				<Badge variant="secondary" className="rounded-md text-[10px] font-normal">
					{filterState.canVisualize ? '可视化' : '原文'}
				</Badge>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">包含</Label>
					<p className="text-[10px] leading-relaxed text-muted-foreground/80">
						只保留匹配这些关键词的自动候选节点；例如 WhatsApp 里台、SG、JP 会限制可选地区。
					</p>
					<Textarea
						value={filterState.includeInput}
						onChange={(event) => onFilterKeywordChange(group, 'include', event.target.value)}
						disabled={readOnly || !filterState.canVisualize}
						placeholder="港, HK, Hong"
						rows={3}
						className="resize-none text-xs"
					/>
				</div>
				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">排除</Label>
					<p className="text-[10px] leading-relaxed text-muted-foreground/80">
						从候选中剔除匹配项，常用来排除倍率、专用节点或带 @ 的节点。
					</p>
					<Textarea
						value={filterState.excludeInput}
						onChange={(event) => onFilterKeywordChange(group, 'exclude', event.target.value)}
						disabled={readOnly || !filterState.canVisualize}
						placeholder="1.5, 倍率:2"
						rows={3}
						className="resize-none text-xs"
					/>
				</div>
			</div>
			<div className="space-y-1.5">
				<Label className="text-xs text-muted-foreground">原始 filter</Label>
				<p className="text-[10px] leading-relaxed text-muted-foreground/80">
					Clash/Mihomo 原始正则；filter 只作用于 include-all、include-all-proxies、include-all-providers 或 use 引入的节点。
				</p>
				<Textarea
					value={filterState.rawFilter}
					onChange={(event) => onRawFilterChange(group, event.target.value)}
					disabled={readOnly}
					rows={3}
					className="resize-none font-mono text-xs"
				/>
			</div>
		</div>
	);
}

function buildOptionMutation(
	group: ProxyGroupSummary,
	draftGroup: string,
	draft: DraftValues,
): { ok: true; value: Partial<Record<ProxyGroupOptionKey, ProxyGroupOptionValue>> } | { ok: false; error: string } {
	if (draftGroup !== group.name) return { ok: true, value: {} };

	const result: Partial<Record<ProxyGroupOptionKey, ProxyGroupOptionValue>> = {};
	for (const [key, value] of Object.entries(draft) as [ProxyGroupOptionKey, string | boolean][]) {
		if (typeof value === 'boolean') {
			result[key] = value;
			continue;
		}
		const trimmed = value.trim();
		if (NUMBER_OPTION_KEYS.has(key)) {
			const numberValue = trimmed ? Number(trimmed) : null;
			if (numberValue !== null && !Number.isFinite(numberValue)) {
				return { ok: false, error: `${key} 必须是数字` };
			}
			result[key] = numberValue;
			continue;
		}
		result[key] = trimmed ? trimmed : null;
	}
	return { ok: true, value: result };
}

const NUMBER_OPTION_KEYS = new Set<ProxyGroupOptionKey>(['interval', 'timeout', 'maxFailedTimes', 'tolerance']);

function draftValue(group: ProxyGroupSummary, draftGroup: string, draft: DraftValues, key: ProxyGroupOptionKey, fallback: string | number | null): string {
	const value = draftGroup === group.name ? draft[key] : undefined;
	if (typeof value === 'string') return value;
	if (typeof fallback === 'number') return String(fallback);
	return fallback ?? '';
}

function draftBool(group: ProxyGroupSummary, draftGroup: string, draft: DraftValues, key: ProxyGroupOptionKey, fallback: boolean): boolean {
	const value = draftGroup === group.name ? draft[key] : undefined;
	return typeof value === 'boolean' ? value : fallback;
}

function splitKeywordInput(value: string): string[] {
	return value
		.split(/[\n,]+/)
		.map((keyword) => keyword.trim())
		.filter(Boolean);
}

function LabeledInput({ label, help, value, disabled, onChange }: { label: string; help?: string; value: string; disabled: boolean; onChange: (value: string) => void }) {
	return (
		<div className="space-y-1.5">
			<Label className="text-xs text-muted-foreground">{label}</Label>
			{help && <p className="text-[10px] leading-relaxed text-muted-foreground/80">{help}</p>}
			<Input value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="h-8 text-xs" />
		</div>
	);
}

function LabeledSwitch({ label, help, checked, disabled, onCheckedChange }: { label: string; help?: string; checked: boolean; disabled: boolean; onCheckedChange: (value: boolean) => void }) {
	return (
		<div className="rounded-md border border-border/60 bg-muted/20 px-2 py-2">
			<div className="flex items-center justify-between gap-3">
				<Label className="text-xs text-muted-foreground">{label}</Label>
				<Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
			</div>
			{help && <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground/80">{help}</p>}
		</div>
	);
}

function FieldPill({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
			<div className="text-[11px] text-muted-foreground">{label}</div>
			<div className="font-semibold tabular-nums text-foreground">{value}</div>
		</div>
	);
}
