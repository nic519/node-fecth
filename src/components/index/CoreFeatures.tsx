import { Cloud, Devices, FileCode, Funnel, Key, Lightning } from '@phosphor-icons/react';

const FEATURES = [
  { icon: Cloud, title: '接入不同服务商', description: '合并多个订阅来源并自动去重，节点来源仍然清晰可查。' },
  { icon: Devices, title: '多设备同步', description: '在网页修改配置后，其他设备通过原订阅地址获取更新。' },
  { icon: Funnel, title: '规则与节点过滤', description: '使用过滤项或正则表达式，剔除不需要的节点与规则。' },
  { icon: Key, title: '独立令牌访问', description: '每份用户配置使用独立令牌校验，管理与订阅地址相互关联。' },
  { icon: FileCode, title: 'YAML 高级覆写', description: '保留可视化编辑之外的精确控制能力，满足进阶配置需求。' },
  { icon: Lightning, title: 'Vercel 部署', description: '订阅和配置管理通过同一个站点访问。' },
];

export function CoreFeatures() {
  return (
    <section id="features" className="content-container scroll-mt-24 py-20 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[0.55fr_1.45fr] lg:gap-16">
        <div><div className="text-xs font-medium text-primary">完整能力</div><h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">简单入口，<br />也保留高级控制。</h2><p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">从合并订阅到精确覆写，每一项能力都围绕同一个目标：减少重复维护。</p></div>
        <div className="grid gap-x-8 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => <article key={title} className="border-t border-border/70 py-6"><Icon weight="fill" className="h-5 w-5 text-primary" /><h3 className="mt-4 text-base font-semibold tracking-[-0.015em]">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></article>)}
        </div>
      </div>
    </section>
  );
}
