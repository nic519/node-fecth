'use client';

import { isMandatoryFilter } from '@/app/config/hooks/useRuleConfig';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ListFilter, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';

interface RuleFilterSelectorProps {
  filterOptions: string[];
  loading?: boolean;
  error?: string | null;
  readOnly?: boolean;
  requiredFilters?: string;
  enableCustomFilters?: boolean;
  onRequiredFiltersChange?: (value: string) => void;
  onEnableCustomFiltersChange?: (checked: boolean) => void;
  isMandatory?: (option: string) => boolean;
}

export function RuleFilterSelector({
  filterOptions,
  loading = false,
  error = null,
  readOnly = false,
  requiredFilters,
  enableCustomFilters,
  onRequiredFiltersChange,
  onEnableCustomFiltersChange,
  isMandatory
}: RuleFilterSelectorProps) {
  const [internalEnable, setInternalEnable] = useState(true);
  const [internalRequired, setInternalRequired] = useState('');

  const isEnableControlled = enableCustomFilters !== undefined && !!onEnableCustomFiltersChange;
  const isRequiredControlled = requiredFilters !== undefined && !!onRequiredFiltersChange;
  const effectiveEnable = isEnableControlled ? enableCustomFilters : internalEnable;
  const effectiveRequired = isRequiredControlled ? requiredFilters : internalRequired;
  const mandatoryChecker = isMandatory ?? isMandatoryFilter;

  const selectedFilters = useMemo(() => {
    if (!effectiveRequired) return [];
    return effectiveRequired.split(',').map(item => item.trim()).filter(item => item);
  }, [effectiveRequired]);

  const mandatoryFilters = useMemo(() => {
    return filterOptions.filter(mandatoryChecker);
  }, [filterOptions, mandatoryChecker]);

  const displaySelectedFilters = useMemo(() => {
    return Array.from(new Set([...selectedFilters, ...mandatoryFilters]));
  }, [selectedFilters, mandatoryFilters]);

  const updateRequiredFilters = (filters: string[]) => {
    const value = filters.join(',');
    if (isRequiredControlled) {
      onRequiredFiltersChange?.(value);
      return;
    }
    setInternalRequired(value);
  };

  const handleFilterToggle = (checked: boolean) => {
    if (isEnableControlled) {
      onEnableCustomFiltersChange?.(checked);
    } else {
      setInternalEnable(checked);
    }
    if (!checked) {
      if (selectedFilters.length > 0) {
        updateRequiredFilters([]);
      }
    }
  };

  const handleFilterSelection = (option: string, checked: boolean) => {
    if (!effectiveEnable) return;
    if (checked) {
      updateRequiredFilters([...selectedFilters, option]);
      return;
    }
    updateRequiredFilters(selectedFilters.filter(item => item !== option));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <Label htmlFor="requiredFilters" className="text-base flex items-center gap-2">
          <div className="p-1 rounded bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
            <ListFilter className="w-3.5 h-3.5" />
          </div>
          需要的规则项
        </Label>
        <div className="flex items-center justify-between sm:justify-end space-x-2 bg-muted/30 sm:bg-transparent p-2 sm:p-0 rounded-lg">
          <Label htmlFor="enable-filters" className="text-sm font-normal text-muted-foreground order-2 sm:order-1">
            {effectiveEnable ? '已启用自定义过滤' : '默认包含所有'}
          </Label>
          <Switch
            id="enable-filters"
            checked={effectiveEnable}
            onCheckedChange={handleFilterToggle}
            disabled={readOnly}
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-teal-500 data-[state=checked]:to-emerald-500 order-1 sm:order-2"
          />
        </div>
      </div>

      <div className={`border border-border/60 rounded-xl p-3 space-y-3 bg-muted/10 backdrop-blur-sm transition-all duration-300 ${!effectiveEnable ? 'opacity-80' : ''}`}>
        {!effectiveEnable && (
          <div className="text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-md border border-border/50 flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
            未启用自定义过滤，默认包含所有策略组。
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            正在加载过滤选项...
          </div>
        ) : error ? (
          <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/20">
            <div className="font-semibold mb-1">加载失败</div>
            {error}
            <br />
            <span className="text-xs text-muted-foreground mt-1 block">请检查规则 URL 是否正确且允许跨域访问。</span>
          </div>
        ) : filterOptions.length === 0 ? (
          <div className="text-muted-foreground text-sm">未找到可用的过滤选项。</div>
        ) : (
          <>
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar ${!effectiveEnable ? 'pointer-events-none grayscale opacity-60' : ''}`}>
              {filterOptions.map((option) => {
                const mandatory = mandatoryChecker(option);
                const isChecked = mandatory || displaySelectedFilters.includes(option);
                const displayChecked = !effectiveEnable || isChecked;

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
                      disabled={readOnly || mandatory || !effectiveEnable}
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
            {effectiveEnable && displaySelectedFilters.length === 0 && (
              <div className="text-sm text-amber-600 dark:text-amber-500 font-medium bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md border border-amber-200 dark:border-amber-900/50 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                请至少选择一项，否则将无法生效 (视为未启用)。
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
