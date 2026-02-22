
import { Card, CardContent } from '@/components/ui/card';
import { Layers, Globe, Filter, FileJson, ShieldCheck } from 'lucide-react';

function FeatureCard({ icon, title, description, iconBgClass }: { icon: React.ReactNode; title: string; description: string; iconBgClass?: string }) {
  return (
    <Card className="border-border/60 bg-card hover:bg-accent/50 transition-colors duration-200 h-full overflow-hidden">
      <CardContent className="p-0">
        <div className={`flex items-center gap-3 p-4 ${iconBgClass || 'bg-muted'}`}>
          <div className="shrink-0">
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
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold">其他功能优势</h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <FeatureCard
          icon={<Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          iconBgClass="bg-indigo-100 dark:bg-indigo-900/30"
          title="全服务商兼容"
          description="可接入任意服务商节点，支持多订阅合并"
        />
        <FeatureCard
          icon={<Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          iconBgClass="bg-emerald-100 dark:bg-emerald-900/30"
          title="多设备自动同步"
          description="编写规则，订阅地址不变，方便多设备同步"
        />
        <FeatureCard
          icon={<Filter className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          iconBgClass="bg-amber-100 dark:bg-amber-900/30"
          title="自定义过滤节点"
          description="比如过滤某些商家的倍速节点，或特殊用途节点"
        />
        <FeatureCard
          icon={<ShieldCheck className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          iconBgClass="bg-rose-100 dark:bg-rose-900/30"
          title="注重隐私"
          description="不需要任何个人信息，即可使用"
        />
        <FeatureCard
          icon={<FileJson className="w-5 h-5 text-violet-600 dark:text-violet-400" />}
          iconBgClass="bg-violet-100 dark:bg-violet-900/30"
          title="可更换模板或覆写"
          description="更加精细化管理分流规则，且可以实时预览"
        />
      </div>
    </section>
  );
}
