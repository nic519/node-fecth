'use client';

import { useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowsClockwise,
  CheckCircle,
  Cloud,
  Funnel,
  GitBranch,
  GlobeHemisphereWest,
  Lightning,
  LinkSimple,
  ShieldCheck,
} from '@phosphor-icons/react';
import { useStaticRuleFilterOptionsWithInitialData } from '@/app/config/hooks/useRuleConfig';
import { CoreFeatures } from '@/components/index/CoreFeatures';
import { LatencyDemo } from '@/components/index/LatencyDemo';
import { SubscriptionDemo } from '@/components/index/SubscriptionDemo';
import { SyncPreviewGrid } from '@/components/index/SyncPreviewGrid';
import { AcmeLogo } from '@/components/NavigationBar';
import { RuleFilterSelector } from '@/components/RuleFilterSelector';
import { Button } from '@/components/ui/button';
import { RegisterUserDialog } from '@/components/RegisterUserDialog';
import { HomeNavbar } from '@/components/HomeNavbar';

export function HomePageClient({ superToken, initialFilterOptions = [] }: { superToken?: string; initialFilterOptions?: string[] }) {
  const { filterOptions, loadingFilters, filterError } = useStaticRuleFilterOptionsWithInitialData(initialFilterOptions);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const openRegister = () => setIsRegisterOpen(true);

  return (
    <div id="top" className="min-h-100dvh bg-background text-foreground">
      <HomeNavbar onRegisterClick={openRegister} />

      <main>
        <section className="content-container grid gap-12 pb-20 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,0.88fr)_minmax(480px,1.12fr)] lg:items-center lg:gap-16 lg:pb-28 lg:pt-24">
          <div className="max-w-xl">
            <div className="mb-6 flex items-center gap-2 text-xs font-medium tracking-[0.08em] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary" />FOR CLASH & MIHOMO</div>
            <h1 className="font-heading text-[42px] font-semibold leading-[1.12] tracking-[-0.05em] sm:text-[56px] lg:text-[60px]">一个订阅地址，<br /><span className="text-primary">持续接管</span><br />你的分流配置。</h1>
            <p className="mt-6 max-w-[34rem] text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">把多个服务商订阅、分流规则和节点过滤放在一处管理。修改一次，所有设备通过原地址获取最新配置。</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button onClick={openRegister} size="lg" className="h-12 rounded-full px-6">创建我的配置<ArrowRight weight="bold" className="h-[18px] w-[18px]" /></Button>
              <a href="#product" className="flex min-h-11 items-center gap-2 px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">看看如何工作<ArrowDown className="h-4 w-4" /></a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">{['多订阅聚合', '60 秒延迟检测', '在线规则覆写'].map((item) => <span key={item} className="flex items-center gap-1.5"><CheckCircle weight="fill" className="h-4 w-4 text-primary" />{item}</span>)}</div>
          </div>

          <div className="relative" aria-label="NodeFetch 配置聚合逻辑示意">
            <div className="subtle-grid absolute inset-0 -z-10 rounded-[32px] opacity-60 [mask-image:radial-gradient(closest-side,black,transparent)] lg:-inset-6" />
            <div className="surface overflow-hidden bg-card/95 shadow-[0_24px_70px_-30px_rgba(0,0,0,0.22)]">
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-4"><div className="flex items-center gap-2.5"><AcmeLogo className="h-7 w-7 rounded-[8px]" /><span className="text-sm font-medium">配置工作台</span></div><span className="text-[11px] text-muted-foreground">产品逻辑示意</span></div>
              <div className="grid gap-3 p-5 sm:grid-cols-[1fr_auto_1.1fr] sm:items-center sm:gap-4 sm:p-7">
                <div className="space-y-3">
                  {[['主订阅', '节点与流量信息', Cloud], ['备用订阅', '自动合并与去重', ArrowsClockwise], ['自定义规则', '过滤与覆写', Funnel]].map(([title, note, Icon]) => {
                    const SourceIcon = Icon as typeof Cloud;
                    return <div key={String(title)} className="rounded-xl bg-secondary/60 p-3.5"><SourceIcon weight="fill" className="h-[18px] w-[18px] text-primary" /><div className="mt-2 text-sm font-medium">{String(title)}</div><div className="mt-0.5 text-[11px] text-muted-foreground">{String(note)}</div></div>;
                  })}
                </div>
                <div className="flex items-center justify-center sm:flex-col"><span className="h-px w-10 bg-border sm:h-8 sm:w-px" /><span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary"><GitBranch weight="fill" className="h-5 w-5" /></span><span className="h-px w-10 bg-border sm:h-8 sm:w-px" /></div>
                <div className="rounded-2xl bg-foreground p-5 text-background">
                  <div className="flex items-center justify-between"><span className="text-xs opacity-65">统一订阅输出</span><Lightning weight="fill" className="h-4 w-4" /></div>
                  <div className="mt-5 break-all font-mono text-xs leading-5 opacity-90">/api/x?uid=your-id&amp;token=••••••</div>
                  <div className="mt-6 space-y-2.5">{['节点已按来源合并', '分流规则已应用', '低延迟线路可自动优选'].map((item) => <div key={item} className="flex items-center gap-2 text-xs"><CheckCircle weight="fill" className="h-4 w-4" />{item}</div>)}</div>
                  <div className="mt-6 flex items-center gap-2 border-t border-background/15 pt-4 text-[11px] opacity-65"><GlobeHemisphereWest className="h-4 w-4" />电脑、手机与软路由共用同一地址</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="product" className="scroll-mt-24 border-y border-border/55 bg-card/45 py-20 sm:py-24">
          <div className="content-container grid items-start gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">
            <div className="lg:sticky lg:top-28"><div className="flex items-center gap-2 text-xs font-medium text-primary"><Funnel weight="fill" className="h-4 w-4" />规则编排</div><h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">不需要从 YAML<br />开始理解规则。</h2><p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">直接勾选需要的过滤项，保留必要的自定义能力。下面的预览就是项目中实际使用的规则组件。</p><div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4" />默认规则与高级覆写可以同时存在</div></div>
            <div className="surface min-w-0 p-4 sm:p-6"><RuleFilterSelector filterOptions={filterOptions} loading={loadingFilters} error={filterError} /></div>
          </div>
        </section>

        <section id="sources" className="content-container scroll-mt-24 py-20 sm:py-24">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
            <div><div className="flex items-center gap-2 text-xs font-medium text-primary"><LinkSimple weight="fill" className="h-4 w-4" />多源聚合</div><h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">服务商可以更换，<br />你的使用习惯不用。</h2><p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">把不同来源合并到固定订阅地址，独立查看每个来源的用量与到期时间，降低单点失效带来的影响。</p><div className="mt-7 grid grid-cols-2 gap-4 text-sm"><div className="border-t border-border pt-4"><strong className="font-medium">自动去重</strong><p className="mt-1 text-xs leading-5 text-muted-foreground">相同节点不再重复出现</p></div><div className="border-t border-border pt-4"><strong className="font-medium">来源可追踪</strong><p className="mt-1 text-xs leading-5 text-muted-foreground">用量与到期状态独立展示</p></div></div></div>
            <div className="surface min-w-0 p-4 sm:p-5"><SubscriptionDemo /></div>
          </div>
          <div className="mt-12"><SyncPreviewGrid /></div>
        </section>

        <section id="latency" className="scroll-mt-24 border-y border-border/55 bg-card/45 py-20 sm:py-24">
          <div className="content-container"><div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-xs font-medium text-primary"><Lightning weight="fill" className="h-4 w-4" />延迟优选</div><h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">让可用线路，自己浮到前面。</h2></div><p className="max-w-md text-sm leading-6 text-muted-foreground">周期性检测节点延迟，在配置更新时提供更合理的线路选择。</p></div><div className="surface overflow-hidden"><LatencyDemo /></div></div>
        </section>

        <CoreFeatures />

        <section className="content-container pb-24"><div className="flex flex-col items-start justify-between gap-6 rounded-[24px] bg-foreground px-6 py-9 text-background sm:px-10 sm:py-12 md:flex-row md:items-center"><div><h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">把下一次配置更新，变简单一点。</h2><p className="mt-2 text-sm leading-6 opacity-65">创建你的专属配置地址，之后的规则修改都在这里完成。</p></div><Button onClick={openRegister} variant="secondary" size="lg" className="h-12 shrink-0 rounded-full px-6">创建我的配置<ArrowRight weight="bold" className="h-[18px] w-[18px]" /></Button></div></section>
      </main>

      <footer className="border-t border-border/60 py-8"><div className="content-container flex flex-col gap-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2.5"><AcmeLogo className="h-7 w-7 rounded-[8px]" /><span className="font-medium text-foreground">NodeFetch</span><span>· 订阅配置与规则管理</span></div><div>© {new Date().getFullYear()} NodeFetch</div></div></footer>

      <RegisterUserDialog isOpen={isRegisterOpen} onOpenChange={setIsRegisterOpen} superToken={superToken} />
    </div>
  );
}
