import { UserConfig } from '@/types/user-config';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Edit, Link, ListFilter } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { YamlEditor } from '@/components/YamlEditor';
import { useRuleConfig } from '../hooks/useRuleConfig';
import { DEFAULT_RULE_URL } from '@/config/constants';
import { cn, secondaryActionButtonClass } from '@/lib/utils';
import { PanelTopBar } from './PanelTopBar';

interface RuleConfigProps {
    config: UserConfig;
    onChange: (newConfig: UserConfig) => void;
    readOnly?: boolean;
}

export function PanelRuleConfig({ config, onChange, readOnly = false }: RuleConfigProps) {
    const {
        filterOptions,
        loadingFilters,
        filterError,
        enableCustomFilters,
        yamlError,
        isMandatory,
        handleChange,
        handleFilterToggle,
        handleFilterSelection,
        handleYamlChange
    } = useRuleConfig({ config, onChange });

    return (
        <div className="space-y-6">
            <PanelTopBar description="选择规则模板与过滤项；可选规则覆写（高级）。" />
            <div className="space-y-2 group">
                <Label htmlFor="ruleUrl" className="flex items-center gap-2 group-focus-within:text-primary transition-colors">
                    <div className="p-1 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                        <Link className="w-3.5 h-3.5" />
                    </div>
                    规则模板 URL
                </Label>
                <Input
                    id="ruleUrl"
                    value={config.ruleUrl || ''}
                    onChange={(e) => handleChange('ruleUrl', e.target.value)}
                    placeholder='可选。Clash 格式的过滤规则文件 URL。'
                    readOnly={readOnly}
                    className="transition-all border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20 hover:border-primary/30"
                />
                <p className="text-sm text-muted-foreground break-all">
                    不填写时默认使用：<a href={DEFAULT_RULE_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                        {DEFAULT_RULE_URL}
                    </a>
                </p>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                    <Label htmlFor="requiredFilters" className="text-base flex items-center gap-2">
                        <div className="p-1 rounded bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                            <ListFilter className="w-3.5 h-3.5" />
                        </div>
                        需要的过滤项
                    </Label>
                    <div className="flex items-center justify-between sm:justify-end space-x-2 bg-muted/30 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                        <Label htmlFor="enable-filters" className="text-sm font-normal text-muted-foreground order-2 sm:order-1">
                            {enableCustomFilters ? '已启用自定义过滤' : '默认包含所有'}
                        </Label>
                        <Switch
                            id="enable-filters"
                            checked={enableCustomFilters}
                            onCheckedChange={handleFilterToggle}
                            disabled={readOnly}
                            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-teal-500 data-[state=checked]:to-emerald-500 order-1 sm:order-2"
                        />
                    </div>
                </div>

                <div className={`border border-border/60 rounded-xl p-3 space-y-3 bg-muted/10 backdrop-blur-sm transition-all duration-300 ${!enableCustomFilters ? 'opacity-80' : ''}`}>
                    {!enableCustomFilters && (
                        <div className="text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-md border border-border/50 flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                            未启用自定义过滤，默认包含所有策略组。
                        </div>
                    )}
                    {loadingFilters ? (
                        <div className="flex items-center justify-center py-4 text-muted-foreground">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            正在加载过滤选项...
                        </div>
                    ) : filterError ? (
                        <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                            <div className="font-semibold mb-1">加载失败</div>
                            {filterError}
                            <br />
                            <span className="text-xs text-muted-foreground mt-1 block">请检查规则 URL 是否正确且允许跨域访问。</span>
                        </div>
                    ) : filterOptions.length === 0 ? (
                        <div className="text-muted-foreground text-sm">未找到可用的过滤选项。</div>
                    ) : (
                        <>
                            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar ${!enableCustomFilters ? 'pointer-events-none grayscale opacity-60' : ''}`}>
                                {filterOptions.map((option) => {
                                    const mandatory = isMandatory(option);
                                    const isChecked = mandatory || config.requiredFilters?.split(',').map(s => s.trim()).includes(option);
                                    // Visual check state: if disabled (not custom), show all as checked to imply "all included"
                                    const displayChecked = !enableCustomFilters || isChecked;

                                    return (
                                        <div
                                            key={option}
                                            className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${displayChecked ? 'bg-primary/10' : 'hover:bg-accent/40'
                                                }`}
                                        >
                                            <Checkbox
                                                id={`filter-${option}`}
                                                checked={displayChecked}
                                                onCheckedChange={(checked) => !mandatory && handleFilterSelection(option, checked as boolean)}
                                                disabled={readOnly || mandatory || !enableCustomFilters}
                                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                            <Label
                                                htmlFor={`filter-${option}`}
                                                className={`text-sm font-medium cursor-pointer flex items-center gap-1.5 flex-1 min-w-0 ${mandatory ? 'text-muted-foreground' : ''}`}
                                            >
                                                <span className="truncate">{option}</span>
                                                {mandatory && <span className="ml-1.5 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full border border-border/50">必选</span>}
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                            {enableCustomFilters && (!config.requiredFilters || config.requiredFilters.length === 0) && (
                                <div className="text-sm text-amber-600 dark:text-amber-500 font-medium bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md border border-amber-200 dark:border-amber-900/50 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    请至少选择一项，否则将无法生效 (视为未启用)。
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                    <Label className="flex items-center gap-2">
                        <div className="p-1 rounded bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                            <Edit className="w-3.5 h-3.5" />
                        </div>
                        规则覆写
                    </Label>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                size="sm"
                                disabled={readOnly}
                                className={cn("w-full sm:w-auto", secondaryActionButtonClass)}
                            >
                                <Edit className="w-3.5 h-3.5" />
                                编辑规则
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] max-w-4xl h-[85vh] sm:h-[80vh] flex flex-col p-4 sm:p-6">
                            <DialogHeader className="mb-2">
                                <DialogTitle>编辑规则覆写</DialogTitle>
                                <DialogDescription className="text-xs sm:text-sm">
                                    在此处输入 YAML 格式的内容以覆写或追加规则。
                                    <span className="text-xs opacity-80 block mt-1 truncate">教程：<a href="https://clashparty.org/docs/guide/override/yaml" target="_blank" rel="noopener noreferrer">https://clashparty.org/docs/guide/override/yaml</a></span>
                                </DialogDescription>
                            </DialogHeader>
                            <div className={`flex-1 min-h-0 border rounded-md overflow-hidden ${yamlError ? 'border-destructive' : ''}`}>
                                <YamlEditor
                                    height="100%"
                                    value={config.ruleOverwrite || ''}
                                    onChange={(val) => handleYamlChange(val)}
                                    readOnly={readOnly}
                                />
                            </div>
                            {yamlError && (
                                <div className="text-destructive text-sm mt-2">
                                    {yamlError}
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
                <p className="text-sm text-muted-foreground">
                    可选。高级用户专用。可以覆盖生成的配置中的任意字段。
                </p>
                {config.ruleOverwrite && (
                    <div className="mt-2 rounded-md border bg-muted p-4 overflow-x-auto max-h-96 overflow-y-auto">
                        <pre className="text-xs font-mono">
                            {config.ruleOverwrite}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
