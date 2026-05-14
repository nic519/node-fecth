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
import type { FilterPreset, Policy, RuleSetRef, VisualTemplateModel } from '../visual-template/types';
import { Activity, GitBranch, Route, Save, ShieldAlert } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';

interface TemplateVisualToolsProps {
	content: string;
	visualModel?: VisualTemplateModel | null;
	readOnly: boolean;
	onChange: (content: string) => void;
	onVisualModelChange?: (model: VisualTemplateModel) => void;
	onRevealProxyGroup?: (groupName: string) => void;
}

type DraftValues = Partial<Record<ProxyGroupOptionKey, string | boolean>>;
type WorkspaceType = 'select' | 'url-test';

export function TemplateVisualTools({ content, visualModel, readOnly, onChange, onVisualModelChange, onRevealProxyGroup }: TemplateVisualToolsProps) {
	if (visualModel) {
		return (
			<VisualModelTools
				model={visualModel}
				readOnly={readOnly}
				onChange={onVisualModelChange}
			/>
		);
	}

	return (
		<YamlVisualTools
			content={content}
			readOnly={readOnly}
			onChange={onChange}
			onRevealProxyGroup={onRevealProxyGroup}
		/>
	);
}

interface YamlVisualToolsProps {
	content: string;
	readOnly: boolean;
	onChange: (content: string) => void;
	onRevealProxyGroup?: (groupName: string) => void;
}

function YamlVisualTools({ content, readOnly, onChange, onRevealProxyGroup }: YamlVisualToolsProps) {
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

function VisualModelTools({
	model,
	readOnly,
	onChange,
}: {
	model: VisualTemplateModel;
	readOnly: boolean;
	onChange?: (model: VisualTemplateModel) => void;
}) {
	const selectPolicies = model.policies.filter((policy) => policy.type === 'select');
	const urlTestPolicies = model.policies.filter((policy) => policy.type === 'url-test');
	const [activeType, setActiveType] = useState<WorkspaceType>('select');
	const [activeSelectTitle, setActiveSelectTitle] = useState('');
	const [activeUrlTestTitle, setActiveUrlTestTitle] = useState('');
	const activeSelectPolicy = selectPolicies.find((policy) => policy.title === activeSelectTitle) ?? selectPolicies[0] ?? null;
	const activeUrlTestPolicy = urlTestPolicies.find((policy) => policy.title === activeUrlTestTitle) ?? urlTestPolicies[0] ?? null;
	const activePolicy = activeType === 'select' ? activeSelectPolicy : activeUrlTestPolicy;

	const updatePolicy = (policyTitle: string, updater: (policy: Policy) => Policy) => {
		if (readOnly || !onChange) return;
		onChange({
			...model,
			policies: model.policies.map((policy) => (policy.title === policyTitle ? updater(policy) : policy)),
		});
	};

	const handlePolicySelect = (type: WorkspaceType, policyTitle: string) => {
		setActiveType(type);
		if (type === 'select') setActiveSelectTitle(policyTitle);
		else setActiveUrlTestTitle(policyTitle);
	};

	return (
		<aside className="max-h-[46vh] min-h-0 border-b border-border/40 bg-background/70 lg:h-full lg:max-h-none lg:w-[720px] lg:shrink-0 lg:border-b-0 lg:border-r">
			<div className="grid h-full min-h-0 grid-cols-1 overflow-y-auto custom-scrollbar lg:grid-cols-[260px_minmax(0,1fr)] lg:overflow-hidden">
				<nav className="min-h-0 border-b border-border/50 lg:border-b-0 lg:border-r">
					<div className="h-full overflow-y-auto custom-scrollbar p-3">
						<ModelPolicyListSection
							title="Select 策略"
							description="直接编辑 visual JSON"
							icon={<Route className="h-4 w-4" />}
							policies={selectPolicies}
							activeTitle={activeType === 'select' ? activePolicy?.title : ''}
							onSelect={(policyTitle) => handlePolicySelect('select', policyTitle)}
						/>
						<ModelPolicyListSection
							title="URL-Test 自动组"
							description="测速与筛选"
							icon={<Activity className="h-4 w-4" />}
							policies={urlTestPolicies}
							activeTitle={activeType === 'url-test' ? activePolicy?.title : ''}
							onSelect={(policyTitle) => handlePolicySelect('url-test', policyTitle)}
							className="mt-4"
						/>
					</div>
				</nav>

				<section className="min-h-[420px] overflow-y-auto custom-scrollbar p-5 text-sm">
					{activePolicy ? (
						<ModelPolicyEditor
							model={model}
							policy={activePolicy}
							readOnly={readOnly || !onChange}
							onUpdate={(updater) => updatePolicy(activePolicy.title, updater)}
						/>
					) : (
						<div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
							当前 JSON 模型里还没有策略。可以先在模型 fixture 或后续新增策略交互中添加 policy。
						</div>
					)}
				</section>
			</div>
		</aside>
	);
}

function ModelPolicyListSection({
	title,
	description,
	icon,
	policies,
	activeTitle,
	onSelect,
	className,
}: {
	title: string;
	description: string;
	icon: React.ReactNode;
	policies: Policy[];
	activeTitle?: string;
	onSelect: (policyTitle: string) => void;
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
					{policies.length}
				</Badge>
			</div>
			<div className="space-y-1">
				{policies.map((policy) => (
					<button
						key={policy.title}
						type="button"
						onClick={() => onSelect(policy.title)}
						className={cn(
							'w-full rounded-md px-3 py-2.5 text-left text-sm transition-colors',
							activeTitle === policy.title
								? 'bg-primary/10 text-primary'
								: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
						)}
					>
						<div className="truncate font-medium">{policy.title}</div>
						<div className="mt-1 flex items-center gap-2 text-xs opacity-80">
							<span>{policy.rules?.length ?? 0} rules</span>
							<span>{policy.proxies?.length ?? 0} refs</span>
						</div>
					</button>
				))}
			</div>
		</section>
	);
}

function ModelPolicyEditor({
	model,
	policy,
	readOnly,
	onUpdate,
}: {
	model: VisualTemplateModel;
	policy: Policy;
	readOnly: boolean;
	onUpdate: (updater: (policy: Policy) => Policy) => void;
}) {
	const updatePatch = (patch: Partial<Policy>) => {
		onUpdate((current) => ({ ...current, ...patch }));
	};

	const updateFilter = (filter: FilterPreset | undefined) => {
		updatePatch({ filter });
	};

	const updateRule = (index: number, patch: Partial<RuleSetRef>) => {
		const rules = [...(policy.rules ?? [])];
		rules[index] = { ...rules[index], ...patch };
		updatePatch({ rules });
	};

	const removeRule = (index: number) => {
		const rules = (policy.rules ?? []).filter((_, currentIndex) => currentIndex !== index);
		updatePatch({ rules: rules.length > 0 ? rules : undefined });
	};

	const addRule = () => {
		const ruleName = createRuleName(policy);
		updatePatch({
			rules: [
				...(policy.rules ?? []),
				{
					name: ruleName,
					behavior: 'domain',
					format: 'mrs',
					url: '',
				},
			],
		});
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<div className="flex items-center justify-between gap-3">
					<h5 className="min-w-0 truncate text-base font-semibold text-foreground">{policy.title}</h5>
					<Badge variant="outline" className="rounded-md text-[10px]">
						{policy.type}
					</Badge>
				</div>
				<div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
					这里直接修改 visual-v1 JSON 模型；最终订阅输出时再编译成 YAML，并与右侧原始 YAML 片段合并。
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2">
				<LabeledInput
					label="策略名称"
					help="最终 YAML 中 proxy-group.name 和 RULE-SET 目标名。"
					value={policy.title}
					disabled={readOnly}
					onChange={(value) => updatePatch({ title: value })}
				/>
			</div>

			{policy.type === 'select' && (
				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">proxies</Label>
					<p className="text-[10px] leading-relaxed text-muted-foreground/80">
						填写策略名称或内置别名，用逗号/换行分隔。当前可用：{model.policies.map((item) => item.title).join(', ')}, direct, reject
					</p>
					<Textarea
						value={(policy.proxies ?? []).join(', ')}
						onChange={(event) => updatePatch({ proxies: splitKeywordInput(event.target.value) })}
						disabled={readOnly}
						rows={3}
						className="resize-none font-mono text-xs"
					/>
				</div>
			)}

			<ModelCommonFields policy={policy} readOnly={readOnly} onUpdate={updatePatch} />

			{policy.type === 'url-test' && (
				<ModelUrlTestFields policy={policy} readOnly={readOnly} onUpdate={updatePatch} />
			)}

			<ModelFilterFields policy={policy} readOnly={readOnly} onUpdate={updateFilter} />

			<div className="space-y-2">
				<div className="flex items-center justify-between gap-3">
					<div>
						<Label className="text-xs font-medium text-foreground">规则集</Label>
						<p className="mt-1 text-[10px] leading-relaxed text-muted-foreground/80">
							这些 JSON 规则会编译为 RULE-SET 和 rule-providers。
						</p>
					</div>
					<Button type="button" size="sm" variant="secondary" onClick={addRule} disabled={readOnly} className="h-8">
						添加规则
					</Button>
				</div>
				{(policy.rules ?? []).length === 0 ? (
					<div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
						这个策略暂时没有 JSON 规则集。
					</div>
				) : (
					<div className="space-y-2">
						{(policy.rules ?? []).map((rule, index) => (
							<ModelRuleEditor
								key={`${rule.name}-${index}`}
								rule={rule}
								readOnly={readOnly}
								onUpdate={(patch) => updateRule(index, patch)}
								onRemove={() => removeRule(index)}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function ModelCommonFields({
	policy,
	readOnly,
	onUpdate,
}: {
	policy: Policy;
	readOnly: boolean;
	onUpdate: (patch: Partial<Policy>) => void;
}) {
	return (
		<div className="space-y-2">
			<div className="grid grid-cols-2 gap-2">
				<LabeledSwitch
					label="include-all"
					help="把所有出站节点和 provider 节点纳入候选。"
					checked={policy.includeAll === true}
					disabled={readOnly}
					onCheckedChange={(value) => onUpdate({ includeAll: value ? true : undefined })}
				/>
				<LabeledSwitch
					label="all proxies"
					help="只纳入配置中直接声明的出站节点。"
					checked={policy.includeAllProxies === true}
					disabled={readOnly}
					onCheckedChange={(value) => onUpdate({ includeAllProxies: value ? true : undefined })}
				/>
			</div>
			<LabeledSwitch
				label="all providers"
				help="只纳入所有 proxy-provider 的节点。"
				checked={policy.includeAllProviders === true}
				disabled={readOnly}
				onCheckedChange={(value) => onUpdate({ includeAllProviders: value ? true : undefined })}
			/>
		</div>
	);
}

function ModelUrlTestFields({
	policy,
	readOnly,
	onUpdate,
}: {
	policy: Policy;
	readOnly: boolean;
	onUpdate: (patch: Partial<Policy>) => void;
}) {
	const urlTest = policy.urlTest ?? {};
	const updateUrlTest = (patch: NonNullable<Policy['urlTest']>) => {
		onUpdate({ urlTest: removeEmptyRecord({ ...urlTest, ...patch }) });
	};

	return (
		<div className="space-y-2">
			<LabeledInput
				label="url"
				help="健康检查地址；留空时使用模型默认值。"
				value={urlTest.url ?? ''}
				disabled={readOnly}
				onChange={(value) => updateUrlTest({ url: value || undefined })}
			/>
			<div className="grid grid-cols-2 gap-2">
				<LabeledInput
					label="interval"
					value={formatOptionalNumber(urlTest.interval)}
					disabled={readOnly}
					onChange={(value) => updateUrlTest({ interval: toOptionalNumber(value) })}
				/>
				<LabeledInput
					label="tolerance"
					value={formatOptionalNumber(urlTest.tolerance)}
					disabled={readOnly}
					onChange={(value) => updateUrlTest({ tolerance: toOptionalNumber(value) })}
				/>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<LabeledInput
					label="timeout"
					value={formatOptionalNumber(urlTest.timeout)}
					disabled={readOnly}
					onChange={(value) => updateUrlTest({ timeout: toOptionalNumber(value) })}
				/>
				<LabeledInput
					label="max failed"
					value={formatOptionalNumber(urlTest.maxFailedTimes)}
					disabled={readOnly}
					onChange={(value) => updateUrlTest({ maxFailedTimes: toOptionalNumber(value) })}
				/>
			</div>
			<LabeledSwitch
				label="lazy"
				help="开启时，未被使用的策略组不主动测速。"
				checked={urlTest.lazy === true}
				disabled={readOnly}
				onCheckedChange={(value) => updateUrlTest({ lazy: value ? true : undefined })}
			/>
		</div>
	);
}

function ModelFilterFields({
	policy,
	readOnly,
	onUpdate,
}: {
	policy: Policy;
	readOnly: boolean;
	onUpdate: (filter: FilterPreset | undefined) => void;
}) {
	const filter = policy.filter ?? {};
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between gap-3">
				<Label className="text-xs font-medium text-foreground">Filter</Label>
				<Badge variant="secondary" className="rounded-md text-[10px] font-normal">
					JSON
				</Badge>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">包含</Label>
					<Textarea
						value={(filter.include ?? []).join(', ')}
						onChange={(event) => onUpdate(normalizeModelFilter({ ...filter, include: splitKeywordInput(event.target.value), raw: undefined }))}
						disabled={readOnly}
						rows={3}
						className="resize-none text-xs"
					/>
				</div>
				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">排除</Label>
					<Textarea
						value={(filter.exclude ?? []).join(', ')}
						onChange={(event) => onUpdate(normalizeModelFilter({ ...filter, exclude: splitKeywordInput(event.target.value), raw: undefined }))}
						disabled={readOnly}
						rows={3}
						className="resize-none text-xs"
					/>
				</div>
			</div>
			<div className="space-y-1.5">
				<Label className="text-xs text-muted-foreground">原始 filter</Label>
				<Textarea
					value={filter.raw ?? ''}
					onChange={(event) => onUpdate(normalizeModelFilter({ raw: event.target.value.trim() || undefined }))}
					disabled={readOnly}
					rows={3}
					className="resize-none font-mono text-xs"
				/>
			</div>
		</div>
	);
}

function ModelRuleEditor({
	rule,
	readOnly,
	onUpdate,
	onRemove,
}: {
	rule: RuleSetRef;
	readOnly: boolean;
	onUpdate: (patch: Partial<RuleSetRef>) => void;
	onRemove: () => void;
}) {
	return (
		<div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3">
			<div className="grid grid-cols-2 gap-2">
				<LabeledInput
					label="name"
					help="最终 YAML 中 rule-provider 的 key。"
					value={rule.name}
					disabled={readOnly}
					onChange={(value) => onUpdate({ name: value })}
				/>
				<LabeledInput
					label="url"
					value={rule.url}
					disabled={readOnly}
					onChange={(value) => onUpdate({ url: value })}
				/>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<ModelSelect
					label="behavior"
					value={rule.behavior}
					disabled={readOnly}
					options={['domain', 'ipcidr', 'classical']}
					onChange={(value) => onUpdate({ behavior: value as RuleSetRef['behavior'] })}
				/>
				<ModelSelect
					label="format"
					value={rule.format}
					disabled={readOnly}
					options={['mrs', 'yaml', 'text']}
					onChange={(value) => onUpdate({ format: value as RuleSetRef['format'] })}
				/>
			</div>
			<div className="flex items-center justify-between gap-3">
				<LabeledSwitch
					label="no-resolve"
					checked={rule.noResolve === true}
					disabled={readOnly}
					onCheckedChange={(value) => onUpdate({ noResolve: value ? true : undefined })}
				/>
				<Button type="button" size="sm" variant="ghost" onClick={onRemove} disabled={readOnly} className="h-8 text-destructive hover:text-destructive">
					删除
				</Button>
			</div>
		</div>
	);
}

function ModelSelect({
	label,
	value,
	disabled,
	options,
	onChange,
}: {
	label: string;
	value: string;
	disabled: boolean;
	options: string[];
	onChange: (value: string) => void;
}) {
	return (
		<div className="space-y-1.5">
			<Label className="text-xs text-muted-foreground">{label}</Label>
			<select
				value={value}
				disabled={disabled}
				onChange={(event) => onChange(event.target.value)}
				className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
			>
				{options.map((option) => (
					<option key={option} value={option}>
						{option}
					</option>
				))}
			</select>
		</div>
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
							{getGroupListMeta(group).map((item) => (
								<span key={item}>{item}</span>
							))}
						</div>
					</button>
				))}
			</div>
		</section>
	);
}

function getGroupListMeta(group: ProxyGroupSummary): string[] {
	if (group.type === 'url-test') {
		return [
			group.includeAll ? 'include-all' : '',
			group.interval ? `${group.interval}s` : '',
			group.filter ? 'filter' : '',
		].filter(Boolean);
	}

	return [
		`${group.proxies.length || group.proxyCount} proxies`,
		group.ruleAssociations.length > 0 ? `${group.ruleAssociations.length} rules` : '',
		group.filter ? 'filter' : '',
	].filter(Boolean);
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

function createRuleName(policy: Policy): string {
	const base = policy.title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '');
	return `${base || 'rule'}_domain`;
}

function normalizeModelFilter(filter: FilterPreset): FilterPreset | undefined {
	const include = filter.include?.filter(Boolean);
	const exclude = filter.exclude?.filter(Boolean);
	const raw = filter.raw?.trim();
	const normalized: FilterPreset = {};

	if (include && include.length > 0) normalized.include = include;
	if (exclude && exclude.length > 0) normalized.exclude = exclude;
	if (raw) normalized.raw = raw;

	return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function removeEmptyRecord<T extends Record<string, unknown>>(value: T): T {
	return Object.fromEntries(
		Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''),
	) as T;
}

function formatOptionalNumber(value: number | undefined): string {
	return typeof value === 'number' ? String(value) : '';
}

function toOptionalNumber(value: string): number | undefined {
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	const parsed = Number(trimmed);
	return Number.isFinite(parsed) ? parsed : undefined;
}
