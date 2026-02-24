'use client';

import { useStaticRuleFilterOptions } from '@/app/config/hooks/useRuleConfig';
import { CoreFeatures } from '@/components/index/CoreFeatures';
import { LatencyDemo } from '@/components/index/LatencyDemo';
import { SubscriptionDemo } from '@/components/index/SubscriptionDemo';
import { SyncPreviewGrid } from '@/components/index/SyncPreviewGrid';
import { AcmeLogo } from '@/components/NavigationBar';
import { RuleFilterSelector } from '@/components/RuleFilterSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { useToastContext } from '@/providers/toast-provider';
import { Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

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
      <div className="max-w-6xl mx-auto  h-16 flex items-center justify-between">
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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 dark:selection:bg-primary/30 font-sans">
      {/* Header */}
      <Header />

      {/* Background Grid Pattern */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
      </div>

      <main className="pt-32 pb-20 px-6">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-24 relative">

          <h1 className="font-heading text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-[1.1]">
            构建极致的
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-600 block mt-2">Clash 分流规则</span>
          </h1>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium  border border-primary/20 hover:bg-primary/20 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Clash 配置 · 规则编排 · 订阅聚合
          </div>
        </div>

        {/* Demo Section 1: Rule Configuration */}
        <section id="config-section" className="max-w-6xl mx-auto mb-32 ">
          <div className="flex flex-col gap-16">
            <div className="space-y-4 text-center">
              <h2 className="font-heading text-3xl md:text-4xl font-bold">所见即所得的规则编排</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                无需编写复杂配置文件。在网页上直接勾选需要的规则集，实时预览生成的配置
              </p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-violet-600/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <Card className="relative border-border/60 bg-card/80 backdrop-blur-md shadow-md">
                <CardContent className="p-8">
                  <RuleFilterSelector
                    filterOptions={filterOptions}
                    loading={loadingFilters}
                    error={filterError}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Demo Section 2: Subscription Management */}
        <section className="max-w-6xl mx-auto mb-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column */}
            <div className="space-y-8 order-2 lg:order-1">
              <div className="relative">
                {/* Decorative background elements */}
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-violet-500/10 rounded-xl blur-2xl -z-10" />
                <SubscriptionDemo />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6 order-1 lg:order-2">
              <h2 className="font-heading text-3xl md:text-4xl font-bold leading-tight">多源聚合与<br /><span className="text-primary">高可用容灾</span></h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                支持无限制添加备用订阅源，不再担心因单点失效导致断网，实现真正的网络高可用
              </p>
              <ul className="space-y-3 mt-4">
                {['自动去重合并', '清晰显示每个节点的来源', '独立展示每个源的用量，到期时间'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-muted-foreground">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-16 relative group"> 
            <SyncPreviewGrid />
          </div>
        </section>

        {/* Demo Section: Latency Test */}
        <section className="max-w-6xl mx-auto mb-32">
          <div className="flex flex-col gap-16">
            {/* Top: Text */}
            <div className="space-y-6 text-center max-w-3xl mx-auto">
              <h2 className="font-heading text-3xl md:text-4xl font-bold">全自动延迟检测与优选</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                每60秒自动对所有节点进行延迟测试，实时切换到延迟最低的线路
              </p>
            </div>

            {/* Bottom: Demo */}
            <div className="w-full relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
                <LatencyDemo />
              </div>
            </div>
          </div>
        </section>

        {/* Core Features Grid */}
        <CoreFeatures />

      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20 backdrop-blur-sm py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-6 opacity-80">
            <AcmeLogo className="w-8 h-8 text-primary" />
            <span className="font-heading font-bold text-lg">NodeFetch</span>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            © {new Date().getFullYear()} NodeFetch. All rights reserved.
          </p>
          <p className="text-muted-foreground/60 text-xs font-mono">
            Built for performance and reliability.
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
