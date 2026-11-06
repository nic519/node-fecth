import { cn } from '@/lib/utils';
import type { SubscriptionIpHeartbeat } from '@/types/subscription-analytics';
import { buildHeartbeatBins, type HeartbeatWindowDays } from '@/utils/heartbeatBins';

interface HeartbeatStripProps {
  heartbeat: SubscriptionIpHeartbeat;
  /** 窗口结束时间（ISO 字符串，通常为统计生成时间；解析失败时退回当前时间） */
  windowEnd: string;
  /** 格子条时间窗口：1 = 最近 24 小时（小时桶），14 = 最近 14 天（天桶） */
  windowDays: HeartbeatWindowDays;
}

const WINDOW_OPTIONS: Array<{ value: HeartbeatWindowDays; label: string }> = [
  { value: 1, label: '24 小时' },
  { value: 14, label: '14 天' },
];

const binStartFormat = new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
const binDayFormat = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' });

/**
 * 心跳格子条窗口切换：紧凑分段控件，放在心跳面板标题行由父组件持有窗口状态，
 * 切换到 14 天时父组件需要按更宽的心跳窗口重新取数。
 */
export function HeartbeatWindowToggle({
  value,
  onChange,
  className,
}: {
  value: HeartbeatWindowDays;
  onChange: (value: HeartbeatWindowDays) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center rounded-lg bg-secondary p-0.5', className)}>
      {WINDOW_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors',
            value === option.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * 心跳格子条：按窗口把心跳聚合成 24 个小时桶或 14 个自然日桶，按桶内次数映射透明度。
 * 窗口范围由切换控件表达，因此不再渲染「时段开始/现在」标注行。
 */
export function HeartbeatStrip({ heartbeat, windowEnd, windowDays }: HeartbeatStripProps) {
  // 窗口结束时间：优先用统计生成时间，异常时退回最近一次心跳（服务端按倒序返回），保证渲染期间纯函数
  const parsedEnd = Date.parse(windowEnd);
  const latestBeatMs = heartbeat.recentHeartbeats.length > 0 ? Date.parse(heartbeat.recentHeartbeats[0]) : Number.NaN;
  const endMs = Number.isFinite(parsedEnd) ? parsedEnd : Number.isFinite(latestBeatMs) ? latestBeatMs : 0;
  const { starts, counts, granularity } = buildHeartbeatBins(heartbeat.recentHeartbeats, endMs, windowDays);
  const max = Math.max(...counts, 1);
  return (
    <div className="min-w-0 flex-1">
      <div
        className="grid h-5 items-end gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${counts.length}, minmax(2px, 1fr))` }}
        aria-label={`${heartbeat.ip} 的连续心跳分布`}
      >
        {counts.map((count, index) => (
          <span
            key={index}
            className={cn('h-5 rounded-[2px]', count ? 'bg-primary' : 'bg-secondary/80')}
            style={count ? { opacity: 0.3 + (count / max) * 0.7 } : undefined}
            title={`${granularity === 'day' ? binDayFormat.format(new Date(starts[index])) : `${binStartFormat.format(new Date(starts[index]))} 起`}：${count} 次心跳`}
          />
        ))}
      </div>
    </div>
  );
}
