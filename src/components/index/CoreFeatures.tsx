import { CalendarCheck, Cloud, Devices, FileCode, Funnel, Pulse } from '@phosphor-icons/react';

const FEATURES = [
  { icon: Cloud, title: '聚合与去重', description: '换服务商不改订阅地址，重复节点自动合并。' },
  { icon: Devices, title: '多设备同步', description: '网页上改一次，各设备下次更新自动拿到新配置。' },
  { icon: Funnel, title: '规则与节点过滤', description: '不想看的节点与规则，勾选或正则一次剔除。' },
  { icon: FileCode, title: 'YAML 高级覆写', description: '可视化之外仍可手写覆写，进阶配置不设限。' },
  { icon: CalendarCheck, title: '到期年历', description: '12 个月年历标出到期日，列表联动，续订一眼可见。' },
  { icon: Pulse, title: 'IP 心跳', description: '按 24 小时或 14 天窗口回顾访问节奏。' },
];

export function CoreFeatures() {
  return (
    <section id="features" className="scroll-mt-24 border-y border-border/55 bg-card/45 py-20 sm:py-24">
      <div className="content-container grid gap-10 lg:grid-cols-[0.55fr_1.45fr] lg:gap-16">
        <div><div className="text-xs font-medium text-primary">完整能力</div><h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">简单入口，<br />也保留高级控制。</h2><p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">多源聚合、用量预测、精确覆写，都指向同一目标：减少重复维护。</p></div>
        <div className="grid gap-x-8 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => <article key={title} className="border-t border-border/70 py-6"><Icon weight="fill" className="h-5 w-5 text-primary" /><h3 className="mt-4 text-base font-semibold tracking-[-0.015em]">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></article>)}
        </div>
      </div>
    </section>
  );
}
