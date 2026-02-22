'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Github } from 'lucide-react';
import { CoreFeatures } from '@/components/CoreFeatures';
import { RuleFilterSelector } from '@/components/RuleFilterSelector';
import { SyncItemCard } from '@/components/SyncItemCard';
import { ModeToggle } from '@/components/ui/mode-toggle';
import type { SyncItemData, SyncStatus, DynamicInfo } from '@/app/config/hooks/useDynamicSync';
import { useStaticRuleFilterOptions } from '@/app/config/hooks/useRuleConfig';
import { SubscriptionDemo } from '@/components/SubscriptionDemo';
import { LatencyDemo } from '@/components/LatencyDemo';
import { AcmeLogo } from '@/components/NavigationBar';

// Static preview data
const previewSyncItems: SyncItemData[] = [
  { url: 'https://sub.nodefetch.io/sub1', source: '主订阅', flag: '🐙' },
  { url: 'https://sub.nodefetch.io/sub2', source: '追加订阅', flag: '🍚' },
  { url: 'https://sub.nodefetch.io/sub3', source: '追加订阅', flag: '🍌' }
];

const previewStatuses: Record<string, SyncStatus> = {
  'https://sub.nodefetch.io/sub1': { status: 'success', message: '流量紧张' },
  'https://sub.nodefetch.io/sub2': { status: 'success', message: '流量充足' },
  'https://sub.nodefetch.io/sub3': { status: 'success', message: '流量充足' }
};

const previewInfos: Record<string, DynamicInfo> = {
  'https://sub.nodefetch.io/sub1': {
    id: 'demo-main',
    url: 'https://sub.nodefetch.io/main',
    traffic: 'upload=402653184;download=307904819200;expire=1779780995;total=336870912000',
    updatedAt: '2026-02-21T02:10:00.000Z',
  },
  'https://sub.nodefetch.io/sub2': {
    id: 'demo-japan',
    url: 'https://sub.nodefetch.io/japan',
    traffic: 'upload=536870912;download=19984954560;expire=1779780995;total=85899345920',
    updatedAt: '2026-02-21T00:05:00.000Z'
  },
  'https://sub.nodefetch.io/sub3': {
    id: 'demo-backup',
    url: 'https://sub.nodefetch.io/backup',
    traffic: 'upload=134217728;download=72805306368;expire=1779780995;total=102400000000',
    updatedAt: '2026-02-21T01:30:00.000Z'
  }
};

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filterOptions, loadingFilters, filterError } = useStaticRuleFilterOptions();

  // Check for admin token (super admin access only)
  useEffect(() => {
    const superToken = searchParams.get('superToken');
    if (superToken) {
      router.push(`/admin/dashboard?superToken=${superToken}`);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-blue-100 dark:selection:bg-blue-900">
      {/* Header */}
      <nav className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AcmeLogo className="w-10 h-10 text-primary" />
            <span className="font-bold text-lg tracking-tight">NodeFetch</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="https://github.com/vpei/node-fecth" target="_blank">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
            </Button>
            <ModeToggle />
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6 border border-blue-100 dark:border-blue-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Clash 订阅配置生成工具
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight">
            专业分流规则与
            <span className="text-blue-600 dark:text-blue-400">多订阅聚合</span>
          </h1>

        </div>

        {/* Demo Section 1: Rule Configuration */}
        <section className="max-w-6xl mx-auto mb-24">
          <div className="flex flex-col gap-12">
            <div className="space-y-6 text-center">
              <h2 className="text-3xl font-bold">简单直观的规则配置</h2>
              <p className="text-muted-foreground text-md leading-relaxed max-w-2xl mx-auto">
                无需编写复杂配置文件。在网页上直接勾选需要的规则集，所见即所得
              </p>
            </div>
            <Card className="border-border/60 bg-card/50 backdrop-blur shadow-xl">
              {/* <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">
                静态交互示例
              </span> */}
              <CardContent className="p-6">

                <RuleFilterSelector
                  filterOptions={filterOptions}
                  loading={loadingFilters}
                  error={filterError}
                />
              </CardContent>
            </Card>
          </div>
        </section>



        {/* Demo Section 2: Subscription Management */}
        <section className="max-w-6xl mx-auto mb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="space-y-8">
              <h2 className="text-3xl font-bold">多订阅容灾与流量监控</h2>
              <p className="text-muted-foreground text-md leading-relaxed">
                支持无限制添加备用订阅源，自动合并节点，不再担心因忘记充值导致断网，实现真正的网络高可用。
              </p>
            </div>

            {/* Right Column */}
            <div className="w-full">
              <div className="relative">
                {/* Decorative background elements */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur-xl -z-10" />
                <SubscriptionDemo />
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {previewSyncItems.map((item) => (
              <SyncItemCard
                key={item.url}
                item={item}
                status={previewStatuses[item.url] || { status: 'idle' }}
                info={previewInfos[item.url]}
                showAction={false}
              />
            ))}
          </div>
        </section>

        {/* Demo Section: Latency Test */}
        <section className="max-w-6xl mx-auto mb-24">
          <div className="flex flex-col gap-12">
            {/* Top: Text */}
            <div className="space-y-6 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold">智能延迟检测与自动优选</h2>
              <p className="text-muted-foreground text-md leading-relaxed">
                NodeFetch 会在后台每分钟自动对所有节点进行延迟测试，自动切换到延迟最低的线路
              </p>
            </div>

            {/* Bottom: Demo */}
            <div className="w-full">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl blur-xl -z-10" />
                <LatencyDemo />
              </div>
            </div>
          </div>
        </section>

        {/* Core Features Grid */}
        <CoreFeatures />

      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} NodeFetch. All rights reserved.
          </p>
          <p className="text-muted-foreground/60 text-xs mt-2">
            Professional Clash Configuration Generator
          </p>
        </div>
      </footer>
    </div>
  );
}



export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
