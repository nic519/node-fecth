'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Layers, Shield, Globe, ArrowRight, Settings2, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import { RuleFilterSelector } from '@/components/RuleFilterSelector';
import { useStaticRuleFilterOptions } from '@/app/config/hooks/useRuleConfig';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filterOptions, loadingFilters, filterError } = useStaticRuleFilterOptions();

  // Check for admin token
  useEffect(() => {
    const superToken = searchParams.get('superToken');
    if (superToken) {
      router.push(`/admin/dashboard?superToken=${superToken}`);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100">
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
              N
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">NodeFetch</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" asChild className="text-slate-600 hover:text-blue-600">
              <Link href="#features">核心能力</Link>
            </Button>
            <Button variant="ghost" asChild className="text-slate-600 hover:text-blue-600">
              <Link href="#scenarios">使用场景</Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Link href="/admin">进入后台</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6 border border-blue-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Clash 订阅配置生成与管理
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5 tracking-tight leading-tight">
              用专业分流规则与多订阅聚合
              <span className="text-blue-600">打造稳定</span>
              的跨设备配置
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl">
              NodeFetch 让订阅配置从此可控：强规则、快检测、易同步。一次编辑规则，多设备即刻一致更新，始终保持最佳线路与可用性。
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="h-11 px-7 text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 rounded-full">
                <Link href="/admin">
                  立即开始管理 <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 px-7 text-base border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-full">
                <Link href="https://github.com/vpei/node-fecth" target="_blank">
                  查看文档
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-500">
              <span className="px-3 py-1 bg-white rounded-full border border-slate-200">每分钟延时检测</span>
              <span className="px-3 py-1 bg-white rounded-full border border-slate-200">多设备自动同步</span>
              <span className="px-3 py-1 bg-white rounded-full border border-slate-200">可扩展规则系统</span>
            </div>
          </div>

          <Card className="border border-slate-200/70 bg-white/90 shadow-xl shadow-slate-200/50">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">实时订阅概览</div>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">在线</span>
              </div>
              <div className="space-y-4">
                <StatusRow title="订阅源 A" status="流量正常" detail="剩余 128GB" />
                <StatusRow title="订阅源 B (备用)" status="稳定可用" detail="剩余 40GB" />
                <StatusRow title="分流规则集" status="已应用" detail="2,480 条规则" />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <StatBadge label="当前最优" value="HK-01" />
                <StatBadge label="平均延时" value="84ms" />
                <StatBadge label="同步设备" value="4 台" />
              </div>
            </CardContent>
          </Card>
        </div>

        <section id="features" className="max-w-6xl mx-auto mt-20 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<Layers className="w-5 h-5 text-blue-600" />}
            title="多订阅聚合"
            description="支持添加、合并多个订阅源，自动去重与统一管理，每个订阅单独展示流量状态。"
          />
          <FeatureCard
            icon={<Settings2 className="w-5 h-5 text-indigo-600" />}
            title="强分流规则"
            description="直接使用专业人员维护的规则集，提升隐匿性与稳定性，规则结构清晰可控。"
          />
          <FeatureCard
            icon={<RefreshCw className="w-5 h-5 text-emerald-600" />}
            title="每分钟检测"
            description="周期性延时测试，实时判断链路是否可用，自动锁定最佳线路。"
          />
          <FeatureCard
            icon={<Globe className="w-5 h-5 text-sky-600" />}
            title="全设备同步"
            description="固定订阅地址，内部规则与覆写在网站完成，一次修改多端同步。"
          />
        </section>

        <section className="max-w-6xl mx-auto mt-20 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-start">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">规则过滤示例</h2>
            <p className="text-slate-600 leading-relaxed">
              首页直接展示规则过滤控件，让配置体验更具真实感。以下为静态数据示例，展示必选项、已选项与开关状态的真实交互形态。
            </p>
            <div className="grid gap-4">
              <ScenarioCard
                title="必选规则自动锁定"
                description="关键策略组会自动标记为必选，保证基础分流稳定生效。"
                icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              />
              <ScenarioCard
                title="自定义过滤一键开关"
                description="快速切换为默认全量策略或精细化过滤方案。"
                icon={<Settings2 className="w-5 h-5 text-indigo-600" />}
              />
            </div>
          </div>
          <Card className="border border-slate-200/70 bg-white/95 shadow-xl shadow-slate-200/40">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">规则过滤控件</div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">静态示例</span>
              </div>
              <RuleFilterSelector
                filterOptions={filterOptions}
                loading={loadingFilters}
                error={filterError}
              />
            </CardContent>
          </Card>
        </section>

        <section id="scenarios" className="max-w-6xl mx-auto mt-20 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">使用场景</h2>
            <p className="text-slate-600 leading-relaxed">
              在电脑上新增一条规则后，只需在 NodeFetch 修改一次，手机、软路由等设备刷新订阅即可自动同步配置。规则统一、策略一致，维护成本显著降低。
            </p>
            <div className="grid gap-4">
              <ScenarioCard
                title="规则一次编辑，多端同步"
                description="新增覆写、过滤节点、分流规则等操作均在网页完成，订阅地址不变。"
                icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />}
              />
              <ScenarioCard
                title="多订阅容灾"
                description="可添加多家服务商订阅，彼此隔离展示流量状态，不再因忘记充值导致断网。"
                icon={<Shield className="w-5 h-5 text-emerald-600" />}
              />
              <ScenarioCard
                title="最佳线路自动选"
                description="一分钟级延时检测，保证链路连通并选取性能最优节点。"
                icon={<Zap className="w-5 h-5 text-amber-500" />}
              />
            </div>
          </div>
          <Card className="border border-slate-200/70 bg-white/90 shadow-xl shadow-slate-200/50">
            <CardContent className="p-6 space-y-4">
              <div className="text-sm text-slate-500">配置变更流程</div>
              <FlowStep index="01" title="在网页完成规则更新" desc="新增覆写、过滤节点、调整分流规则" />
              <FlowStep index="02" title="云端保存并生成订阅" desc="固定订阅地址保持不变" />
              <FlowStep index="03" title="设备刷新订阅自动同步" desc="电脑、手机、软路由一致生效" />
            </CardContent>
          </Card>
        </section>

        <section className="max-w-6xl mx-auto mt-20">
          <div className="grid md:grid-cols-3 gap-6">
            <HighlightCard
              title="专业分流策略"
              description="预置高质量规则集，覆盖常见流量分流场景，兼顾稳定性与隐私保护。"
            />
            <HighlightCard
              title="节点接入无限制"
              description="兼容任何服务商订阅格式，灵活扩展新增订阅源，轻松合并。"
            />
            <HighlightCard
              title="稳定运行保障"
              description="实时链路检测 + 分流优化，让节点始终保持可用与高性能。"
            />
          </div>
        </section>

        <section className="max-w-6xl mx-auto mt-20">
          <Card className="border border-slate-200/70 bg-gradient-to-br from-white to-blue-50 shadow-xl shadow-slate-200/50">
            <CardContent className="p-8 md:p-10 grid md:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">多订阅管理，一目了然</h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  合并多个订阅源同时保留独立流量状态视图，支持容灾与备用线路切换，确保任何时刻都能保持联通。
                </p>
                <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                  <span className="px-3 py-1 bg-white rounded-full border border-slate-200">流量状态独立展示</span>
                  <span className="px-3 py-1 bg-white rounded-full border border-slate-200">订阅容灾自动切换</span>
                  <span className="px-3 py-1 bg-white rounded-full border border-slate-200">规则覆盖多设备</span>
                </div>
              </div>
              <div className="space-y-3">
                <MiniCard title="订阅源 A" meta="剩余 128GB" />
                <MiniCard title="订阅源 B" meta="剩余 40GB" />
                <MiniCard title="订阅源 C" meta="即将到期" highlight />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="max-w-6xl mx-auto mt-20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-900">常见问题</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <FaqCard
              question="如何保证分流规则的稳定性？"
              answer="规则集由专业人员维护，并持续迭代更新，避免误杀与规则失效。"
            />
            <FaqCard
              question="订阅地址是否会变化？"
              answer="不会变化。你只需在网页调整规则和覆写内容，设备侧刷新订阅即可同步。"
            />
            <FaqCard
              question="多订阅合并后还能看流量吗？"
              answer="每个订阅源仍保持独立流量状态展示，避免忽略充值导致断网。"
            />
            <FaqCard
              question="延时检测的频率是多少？"
              answer="系统每分钟检测一次节点延时，自动选取最优线路保障体验。"
            />
          </div>
        </section>

        <section className="max-w-6xl mx-auto mt-20">
          <Card className="border border-blue-200 bg-blue-600 text-white shadow-xl shadow-blue-600/30">
            <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">准备好掌控你的订阅配置了吗？</h3>
                <p className="text-blue-100">用更稳定、更安全的方式管理你的 Clash 配置。</p>
              </div>
              <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-blue-50 rounded-full h-11 px-8">
                <Link href="/admin">
                  立即进入后台 <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} NodeFetch. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <span>专业分流</span>
            <span>多订阅管理</span>
            <span>设备同步</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border border-slate-200/70 bg-white/90 shadow-sm hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-200">
      <CardContent className="p-6">
        <div className="w-10 h-10 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 leading-relaxed text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatusRow({ title, status, detail }: { title: string; status: string; detail: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
      <div>
        <div className="font-medium text-slate-900">{title}</div>
        <div className="text-xs text-slate-500">{detail}</div>
      </div>
      <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">{status}</span>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-2 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900 mt-1">{value}</div>
    </div>
  );
}

function ScenarioCard({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <Card className="border border-slate-200/70 bg-white/90 shadow-sm">
      <CardContent className="p-5 flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <div className="font-semibold text-slate-900 mb-1">{title}</div>
          <div className="text-sm text-slate-600 leading-relaxed">{description}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function FlowStep({ index, title, desc }: { index: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
        {index}
      </div>
      <div>
        <div className="font-semibold text-slate-900">{title}</div>
        <div className="text-sm text-slate-600">{desc}</div>
      </div>
    </div>
  );
}

function HighlightCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border border-slate-200/70 bg-white/90 shadow-sm">
      <CardContent className="p-6">
        <div className="font-semibold text-slate-900 mb-2">{title}</div>
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function MiniCard({ title, meta, highlight }: { title: string; meta: string; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-between">
        <div className="font-medium text-slate-900">{title}</div>
        <span className={`text-xs px-2 py-1 rounded ${highlight ? 'bg-amber-200 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
          {highlight ? '即将到期' : '正常'}
        </span>
      </div>
      <div className="text-xs text-slate-500 mt-2">{meta}</div>
    </div>
  );
}

function FaqCard({ question, answer }: { question: string; answer: string }) {
  return (
    <Card className="border border-slate-200/70 bg-white/90 shadow-sm">
      <CardContent className="p-6 space-y-2">
        <div className="font-semibold text-slate-900">{question}</div>
        <p className="text-sm text-slate-600 leading-relaxed">{answer}</p>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
