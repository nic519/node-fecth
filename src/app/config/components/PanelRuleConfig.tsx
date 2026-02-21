import { UserConfig } from '@/types/user-config';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Link } from 'lucide-react';
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
import { RuleFilterSelector } from '@/components/RuleFilterSelector';

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
        handleChange,
        handleFilterToggle,
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

            <RuleFilterSelector
                filterOptions={filterOptions}
                loading={loadingFilters}
                error={filterError}
                readOnly={readOnly}
                requiredFilters={config.requiredFilters ?? ''}
                enableCustomFilters={enableCustomFilters}
                onRequiredFiltersChange={(value) => handleChange('requiredFilters', value)}
                onEnableCustomFiltersChange={handleFilterToggle}
            />

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
