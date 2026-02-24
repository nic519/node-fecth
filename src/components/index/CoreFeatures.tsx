
import { Card, CardContent } from '@/components/ui/card';
import { FileJson, Filter, Globe, Layers, ShieldCheck, Zap } from 'lucide-react';

function FeatureCard({ icon, title, description, iconBgClass }: { icon: React.ReactNode; title: string; description: string; iconBgClass?: string }) {
  return (
    <Card className="border-border/60 bg-card hover:bg-accent/50 transition-colors duration-200 h-full overflow-hidden group">
      <CardContent className="p-0">
        <div className={`flex items-center gap-3 p-4 ${iconBgClass || 'bg-muted'}`}>
          <div className="shrink-0 transition-transform duration-300 group-hover:scale-110">
            {icon}
          </div>
          <h3 className="text-base font-bold leading-tight">{title}</h3>
        </div>
        <div className="p-6 pt-4">
          <p className="text-muted-foreground leading-relaxed text-sm">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function CoreFeatures() {
  return (
    <section className="max-w-6xl mx-auto mb-24">
      <div className="text-center mb-16">
        <h2 className="font-heading text-3xl md:text-4xl font-bold">更多核心特性</h2> 
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard
          icon={<Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          iconBgClass="bg-indigo-50 dark:bg-indigo-900/20"
          title="全服务商兼容"
          description="无缝接入任意服务商节点，支持多订阅源自动合并与去重。"
        />
        <FeatureCard
          icon={<Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          iconBgClass="bg-emerald-50 dark:bg-emerald-900/20"
          title="多设备自动同步"
          description="云端配置，一处修改，所有设备即时生效，无需重复配置。"
        />
        <FeatureCard
          icon={<Filter className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          iconBgClass="bg-amber-50 dark:bg-amber-900/20"
          title="自定义规则过滤"
          description="支持正则与关键词过滤，轻松剔除倍率节点或无效节点。"
        />
        <FeatureCard
          icon={<ShieldCheck className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          iconBgClass="bg-rose-50 dark:bg-rose-900/20"
          title="隐私安全优先"
          description="纯前端处理敏感信息，无数据留存，完全匿名的使用体验。"
        />
        <FeatureCard
          icon={<FileJson className="w-5 h-5 text-violet-600 dark:text-violet-400" />}
          iconBgClass="bg-violet-50 dark:bg-violet-900/20"
          title="灵活模板覆写"
          description="支持高级用户自定义配置模板，精细化控制每一条分流规则。"
        />
        <FeatureCard
          icon={<Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          iconBgClass="bg-blue-50 dark:bg-blue-900/20"
          title="高性能架构"
          description="基于 Cloudflare Edge 构建，全球低延迟响应，秒级生成配置。"
        />
      </div>
    </section>
  );
}
