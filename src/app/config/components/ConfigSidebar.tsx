'use client';

import {
  ArrowsClockwise,
  ChartLine,
  CheckCircle,
  Clock,
  Eye,
  FloppyDisk,
  Key,
  ShieldCheck,
  SlidersHorizontal,
  SpinnerGap,
  UserCircle,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { AcmeLogo } from '@/components/NavigationBar';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ConfigTab } from './ConfigForm';
import { SubscribeUrlPanel } from './SubscribeUrlPanel';
import { BookmarkButton } from './BookmarkButton';

interface ConfigSidebarProps {
  uid: string;
  token: string;
  activeTab: ConfigTab;
  onTabChange: (tab: ConfigTab) => void;
  validationErrors: string[];
  lastSaved?: Date | null;
  onSave: () => void;
  saving: boolean;
  saveSuccess: boolean;
  saveError?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS = [
  { id: 'analytics', label: '用量分析', note: '流量趋势与访问心跳', icon: ChartLine },
  { id: 'basic', label: '基础配置', note: '订阅源与节点过滤', icon: SlidersHorizontal },
  { id: 'rules', label: '规则模板', note: '分流规则与覆写', icon: ShieldCheck },
  { id: 'dynamic', label: '订阅加载', note: '同步状态与线路', icon: ArrowsClockwise },
  { id: 'token', label: '访问令牌', note: '配置访问安全', icon: Key },
  { id: 'preview', label: '预览结果', note: '检查最终 YAML', icon: Eye },
] as const;

export function ConfigSidebar(props: ConfigSidebarProps) {
  const { uid, token, activeTab, onTabChange, validationErrors, lastSaved, onSave, saving, saveSuccess, saveError, isOpen, onClose } = props;
  const hasErrors = validationErrors.length > 0;
  const saveLabel = saving ? '正在保存…' : saveSuccess ? '已保存' : hasErrors ? '请先修正配置' : '保存配置';

  return (
    <>
      {isOpen && <button type="button" aria-label="关闭配置导航" className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm md:hidden" onClick={onClose} />}
      <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-[292px] max-w-[88vw] flex-col border-r border-border/60 bg-background transition-transform duration-200 md:translate-x-0', isOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex min-h-[76px] items-center gap-3 border-b border-border/60 px-5">
          <AcmeLogo className="h-9 w-9" />
          <div className="min-w-0 flex-1"><div className="text-[15px] font-semibold tracking-[-0.02em]">NodeFetch</div><div className="text-[11px] text-muted-foreground">用户配置后台</div></div>
          <BookmarkButton className="h-10 w-10 border-transparent bg-transparent shadow-none hover:bg-secondary" />
          <ModeToggle className="h-10 w-10 border-transparent bg-transparent shadow-none hover:bg-secondary" />
          <Button variant="ghost" size="icon" className="h-10 w-10 md:hidden" onClick={onClose} aria-label="关闭导航"><X className="h-5 w-5" /></Button>
        </div>

        <div className="border-b border-border/60 px-5 py-5">
          <div className="flex items-center gap-2.5"><UserCircle weight="fill" className="h-5 w-5 text-muted-foreground" /><span className="min-w-0 flex-1 truncate font-mono text-sm font-medium" title={uid}>{uid}</span></div>
          <div className="mt-4"><div className="mb-2 text-xs text-muted-foreground">订阅地址 <span className="text-muted-foreground/70">· 点击复制并导入客户端</span></div><SubscribeUrlPanel uid={uid} token={token} /></div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="配置步骤">
          {NAV_ITEMS.map((item, index) => {
            const active = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button type="button" key={item.id} onClick={() => onTabChange(item.id)} aria-current={active ? 'step' : undefined} className={cn('flex min-h-[62px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors', active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-secondary/65 hover:text-foreground')}>
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]', active ? 'bg-card text-primary shadow-sm' : 'bg-secondary/65')}><Icon weight={active ? 'fill' : 'regular'} className="h-[18px] w-[18px]" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.label}</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{item.note}</span></span>
                <span className={cn('text-[10px] tabular-nums', active ? 'text-primary' : 'text-muted-foreground/45')}>0{index + 1}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border/60 bg-card/45 p-4">
          {lastSaved && !saveError && <div className="mb-2.5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground"><Clock className="h-3.5 w-3.5" />上次保存 {lastSaved.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</div>}
          <Button onClick={onSave} disabled={saving || hasErrors} className="h-12 w-full rounded-xl text-sm font-semibold shadow-sm">
            {saving ? <SpinnerGap className="h-[18px] w-[18px] animate-spin" /> : saveSuccess ? <CheckCircle weight="fill" className="h-[18px] w-[18px]" /> : hasErrors ? <WarningCircle weight="fill" className="h-[18px] w-[18px]" /> : <FloppyDisk weight="fill" className="h-[18px] w-[18px]" />}
            {saveLabel}
          </Button>
          {saveError && <div role="alert" className="mt-3 flex items-start gap-2 text-xs leading-5 text-destructive"><WarningCircle weight="fill" className="mt-0.5 h-4 w-4 shrink-0" /><span>{saveError}</span></div>}
        </div>
      </aside>
    </>
  );
}
