'use client';

import { useState } from 'react';
import { List, WarningCircle } from '@phosphor-icons/react';
import { Card, CardContent } from '@/components/ui/card';
import { ValidationMessage } from './ValidationMessage';
import { ConfigForm, ConfigTab } from './ConfigForm';
import { UserConfig } from '@/types/user-config';
import { PanelPreview } from './PanelPreview';
import { ConfigSidebar } from './ConfigSidebar';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { AcmeLogo } from '@/components/NavigationBar';
import type { SubscriptionProxyProvider } from '@/config/subscription-proxy.config';

interface ConfigEditorProps {
  uid: string;
  token: string;
  config: UserConfig | null;
  validationErrors: string[];
  onConfigChange: (config: UserConfig) => void;
  lastSaved?: Date | null;
  activeTab: ConfigTab;
  onTabChange: (tab: ConfigTab) => void;
  onSave: () => void;
  saving: boolean;
  saveSuccess: boolean;
  loading?: boolean;
  error?: string | null;
  saveError?: string | null;
  availableProxyProviders: SubscriptionProxyProvider[];
}

const TAB_COPY: Record<ConfigTab, { title: string; description: string }> = {
  basic: { title: '基础配置', description: '管理订阅源、配置名称和节点过滤。建议保留至少两个可用来源。' },
  rules: { title: '规则模板', description: '选择分流规则并按需覆写，变更会应用到同一订阅地址。' },
  dynamic: { title: '订阅加载', description: '检查各来源的同步状态，并选择适合的订阅拉取线路。' },
  token: { title: '访问令牌', description: '令牌用于保护配置与订阅地址，变更后请重新导入客户端。' },
  analytics: { title: '用量分析', description: '订阅流量使用趋势与本账号的访问心跳。' },
  preview: { title: '预览结果', description: '在保存后检查实际生成的 YAML，确认规则与节点符合预期。' },
};

export function ConfigEditor(props: ConfigEditorProps) {
  const { uid, token, config, validationErrors, onConfigChange, lastSaved, activeTab, onTabChange, onSave, saving, saveSuccess, loading, error, saveError, availableProxyProviders } = props;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const copy = TAB_COPY[activeTab];

  return (
    <div className="min-h-100dvh bg-background">
      <ConfigSidebar uid={uid} token={token} activeTab={activeTab} onTabChange={(tab) => { onTabChange(tab); setIsSidebarOpen(false); }} validationErrors={validationErrors} lastSaved={lastSaved} onSave={onSave} saving={saving} saveSuccess={saveSuccess} saveError={saveError} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="md:pl-[292px]">
        <header className="glass-header sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 px-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} aria-label="打开配置导航"><List weight="bold" className="h-5 w-5" /></Button>
          <AcmeLogo className="h-8 w-8 rounded-[9px]" />
          <div><div className="text-sm font-semibold">NodeFetch</div><div className="text-[11px] text-muted-foreground">{copy.title}</div></div>
        </header>

        <main className="mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
          {loading ? <div className="flex min-h-[60dvh] items-center justify-center"><Loading message="加载配置中…" /></div> : error ? (
            <div className="flex min-h-[60dvh] items-center justify-center"><Card className="surface w-full max-w-md shadow-none"><CardContent className="p-7 text-center"><WarningCircle weight="fill" className="mx-auto h-8 w-8 text-destructive" /><h1 className="mt-4 text-xl font-semibold">配置加载失败</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{error}</p><Button onClick={() => window.location.reload()} variant="destructive" className="mt-6 w-full">重新加载</Button></CardContent></Card></div>
          ) : config ? (
            <>
              {validationErrors.length > 0 && <div className="mb-5"><ValidationMessage validationErrors={validationErrors} /></div>}
              <section className="surface overflow-hidden">
                <div className="p-5 sm:p-7 lg:p-8">
                  {activeTab === 'preview' ? <PanelPreview uid={uid} token={token} /> : <ConfigForm config={config} onChange={onConfigChange} activeTab={activeTab} uid={uid} token={token} availableProxyProviders={availableProxyProviders} />}
                </div>
              </section>
            </>
          ) : <div className="flex min-h-[50dvh] items-center justify-center text-sm text-muted-foreground">暂无配置数据</div>}
        </main>
      </div>
    </div>
  );
}
