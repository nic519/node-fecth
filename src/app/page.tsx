'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Github, Sparkles } from 'lucide-react';
import { CoreFeatures } from '@/components/CoreFeatures';
import { RuleFilterSelector } from '@/components/RuleFilterSelector';
import { SyncPreviewGrid } from '@/components/index/SyncPreviewGrid';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { useStaticRuleFilterOptions } from '@/app/config/hooks/useRuleConfig';
import { SubscriptionDemo } from '@/components/SubscriptionDemo';
import { LatencyDemo } from '@/components/index/LatencyDemo';
import { AcmeLogo } from '@/components/NavigationBar';
import { useToastContext } from '@/providers/toast-provider';

function Header() {
  const { showToast } = useToastContext();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsVisible(true);
      } else {
        if (currentScrollY > lastScrollY.current) {
          setIsVisible(false); // Hide when scrolling down
        } else {
          setIsVisible(true); // Show when scrolling up
        }
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, []);

  return (
    <nav className={`fixed top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AcmeLogo className="w-10 h-10 text-primary" />
          <span className="font-bold text-lg tracking-tight">NodeFetch</span>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => showToast('即将开放', 'info')}><Sparkles className="w-4 h-4" />立即使用</Button>
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}

// Static preview data
// Moved to SyncPreviewGrid component

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
      <Header />

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
          <SyncPreviewGrid />
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
