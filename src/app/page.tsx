'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Layers, Shield, Globe, ArrowRight, Settings2 } from 'lucide-react';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for admin token
  useEffect(() => {
    const superToken = searchParams.get('superToken');
    if (superToken) {
      router.push(`/admin/dashboard?superToken=${superToken}`);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
              N
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">NodeFetch</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" asChild className="text-slate-600 hover:text-blue-600">
              <Link href="#features">特性</Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Link href="/admin">进入后台</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6 border border-blue-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            新一代订阅管理工具
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
            化繁为简，
            <span className="text-blue-600">掌控</span>
            您的节点订阅
          </h1>

          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            专为多订阅场景设计。智能聚合、精准过滤、多端适配。
            <br className="hidden md:block" />
            让复杂的节点配置管理变得前所未有的简单。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="h-12 px-8 text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 rounded-full transition-transform hover:scale-105">
              <Link href="/admin">
                立即开始管理 <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-full">
              <Link href="https://github.com/vpei/node-fecth" target="_blank">
                查看文档
              </Link>
            </Button>
          </div>
        </div>

        {/* Core Features Grid */}
        <div id="features" className="max-w-6xl mx-auto mt-24 grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Layers className="w-6 h-6 text-blue-600" />}
            title="多订阅聚合"
            description="不再为分散的订阅链接烦恼。支持无限制合并多个订阅源，自动去重与统一管理，一键生成最终配置。"
          />
          <FeatureCard
            icon={<Settings2 className="w-6 h-6 text-indigo-600" />}
            title="智能过滤规则"
            description="强大的正则匹配与地区筛选功能。轻松剔除无效节点，只保留您真正需要的优质线路。"
          />
          <FeatureCard
            icon={<Globe className="w-6 h-6 text-emerald-600" />}
            title="多端口模式"
            description="针对不同地区（HK, US, JP...）自动生成独立端口配置。实现精细化的分流策略，优化网络体验。"
          />
        </div>

        {/* Secondary Features */}
        <div className="max-w-6xl mx-auto mt-16 pt-16 border-t border-slate-200">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-900">为什么选择 NodeFetch？</h2>
              <div className="space-y-4">
                <CheckItem text="极简配置：基于 YAML 的可视化编辑，直观易懂" />
                <CheckItem text="云端同步：基于 Cloudflare KV，配置实时云端保存" />
                <CheckItem text="安全可靠：访问令牌机制，保护您的私有订阅信息" />
                <CheckItem text="高性能：边缘计算驱动，毫秒级响应速度" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="font-medium text-slate-900">订阅源 A</div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">已启用</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="font-medium text-slate-900">订阅源 B (备用)</div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">已启用</span>
                </div>
                <div className="flex items-center justify-center py-2">
                  <ArrowRight className="text-slate-400 transform rotate-90" />
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                  <div className="font-semibold text-blue-600">统一聚合订阅</div>
                  <div className="text-xs text-slate-500 mt-1">自动去重 • 地区过滤 • 规则优化</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} NodeFetch. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
              <span className="sr-only">GitHub</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border-0 shadow-none bg-transparent hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 rounded-2xl p-2">
      <CardContent className="p-6">
        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
        <Shield className="w-3 h-3 text-blue-600" />
      </div>
      <span className="text-slate-700">{text}</span>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
