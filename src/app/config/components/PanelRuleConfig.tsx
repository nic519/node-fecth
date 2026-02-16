import { UserConfig } from '@/types/openapi-schemas';
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
            <div className="space-y-2">
                <Label htmlFor="ruleUrl" className="flex items-center gap-2">
                    <Link className="w-4 h-4" />
                    规则模板 URL
                </Label>
                <Input
                    id="ruleUrl"
                    value={config.ruleUrl || ''}
                    onChange={(e) => handleChange('ruleUrl', e.target.value)}
                    placeholder="https://raw.githubusercontent.com/..."
                    readOnly={readOnly}
                />
                <p className="text-sm text-muted-foreground">
                    可选。Clash 格式的过滤规则文件 URL。默认为 miho-cfg.yaml 的规则。
                </p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor="requiredFilters" className="text-base flex items-center gap-2">
                        <ListFilter className="w-4 h-4" />
                        需要的过滤项
                    </Label>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="enable-filters"
                            checked={enableCustomFilters}
                            onCheckedChange={handleFilterToggle}
                            disabled={readOnly}
                        />
                        <Label htmlFor="enable-filters" className="text-sm font-normal text-muted-foreground">
                            {enableCustomFilters ? '已启用自定义过滤' : '默认包含所有'}
                        </Label>
                    </div>
                </div>

                {enableCustomFilters ? (
                    <div className="border rounded-md p-4 space-y-4 bg-background">
                        {loadingFilters ? (
                            <div className="flex items-center justify-center py-4 text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                正在加载过滤选项...
                            </div>
                        ) : filterError ? (
                            <div className="text-destructive text-sm">
                                加载失败: {filterError}
                                <br />
                                <span className="text-xs text-muted-foreground">请检查规则 URL 是否正确且允许跨域访问。</span>
                            </div>
                        ) : filterOptions.length === 0 ? (
                            <div className="text-muted-foreground text-sm">未找到可用的过滤选项。</div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2">
                                    {filterOptions.map((option) => {
                                        const mandatory = isMandatory(option);
                                        const isChecked = mandatory || config.requiredFilters?.split(',').map(s => s.trim()).includes(option);

                                        return (
                                            <div key={option} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`filter-${option}`}
                                                    checked={isChecked}
                                                    onCheckedChange={(checked) => !mandatory && handleFilterSelection(option, checked as boolean)}
                                                    disabled={readOnly || mandatory}
                                                />
                                                <Label
                                                    htmlFor={`filter-${option}`}
                                                    className={`text-sm font-normal cursor-pointer ${mandatory ? 'text-muted-foreground' : ''}`}
                                                >
                                                    {option}
                                                    {mandatory && <span className="ml-1 text-xs text-primary">(必选)</span>}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                                {(!config.requiredFilters || config.requiredFilters.length === 0) && (
                                    <p className="text-sm text-destructive font-medium">
                                        请至少选择一项，否则将无法生效 (视为未启用)。
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground border border-dashed rounded-lg p-4 text-center">
                        未启用自定义过滤，将保留规则文件中的所有策略组。
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>规则覆写</Label>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={readOnly}>
                                <Edit className="w-4 h-4 mr-2" />
                                编辑规则
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>编辑规则覆写</DialogTitle>
                                <DialogDescription>
                                    在此处输入 YAML 格式的内容以覆写或追加规则。
                                    <span className="text-xs opacity-80 block mt-1">教程：<a href="https://clashparty.org/docs/guide/override/yaml" target="_blank" rel="noopener noreferrer">https://clashparty.org/docs/guide/override/yaml</a></span>
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
