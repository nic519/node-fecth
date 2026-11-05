'use client';

import { useEffect, useId, useRef, useState } from 'react';

import type { SubscriptionTrendPoint } from '@/types/subscription-analytics';

interface TrafficTrendChartProps {
  points: SubscriptionTrendPoint[];
  granularity: 'hour' | 'day';
}

const HEIGHT = 240;
const PAD_LEFT = 44;
const PAD_RIGHT = 44;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

function formatTick(iso: string, granularity: 'hour' | 'day') {
  const date = new Date(iso);
  if (granularity === 'hour') {
    return `${String(date.getHours()).padStart(2, '0')}:00`;
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatFull(iso: string, granularity: 'hour' | 'day') {
  const date = new Date(iso);
  const day = `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  if (granularity === 'hour') return `${day} ${String(date.getHours()).padStart(2, '0')}:00`;
  return day;
}

function buildPath(values: number[], xOf: (index: number) => number, yOf: (value: number) => number) {
  return values
    .map((value, index) => `${index === 0 ? 'M' : 'L'}${xOf(index).toFixed(2)},${yOf(value).toFixed(2)}`)
    .join(' ');
}

/**
 * 访问趋势曲线：左轴订阅拉取次数（面积图），右轴唯一 IP（折线）。
 * 用 ResizeObserver 按容器实际像素宽度布局，字号与描边不随拉伸变形。
 */
export function TrafficTrendChart({ points, granularity }: TrafficTrendChartProps) {
  const gradientId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const totalRequests = points.reduce((sum, point) => sum + point.requests, 0);
  const peak = Math.max(...points.map((point) => point.requests), 0);
  const peakIndex = points.findIndex((point) => point.requests === peak);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />拉取次数（左轴）</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />唯一 IP（右轴）</span>
        {points.length > 0 && (
          <span className="ml-auto tabular-nums">
            共 {totalRequests.toLocaleString()} 次 · 峰值 {peak.toLocaleString()} 次/{granularity === 'hour' ? '小时' : '天'}（{formatFull(points[peakIndex]?.start ?? '', granularity)}）
          </span>
        )}
      </div>

      <div ref={containerRef} className="w-full">
        {!points.length ? (
          <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">所选时段暂无访问记录</div>
        ) : width > 0 ? (
          <ChartBody
            points={points}
            granularity={granularity}
            width={width}
            gradientId={gradientId}
          />
        ) : (
          <div className="h-60" aria-hidden />
        )}
      </div>
    </div>
  );
}

function ChartBody({
  points,
  granularity,
  width,
  gradientId,
}: TrafficTrendChartProps & { width: number; gradientId: string }) {
  const innerWidth = Math.max(1, width - PAD_LEFT - PAD_RIGHT);
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const count = points.length;

  const maxRequests = Math.max(...points.map((point) => point.requests), 1);
  const maxIps = Math.max(...points.map((point) => point.uniqueIps), 1);

  const xOf = (index: number) => PAD_LEFT + (count === 1 ? innerWidth / 2 : (index / (count - 1)) * innerWidth);
  const yRequests = (value: number) => PAD_TOP + innerHeight - (value / maxRequests) * innerHeight;
  const yIps = (value: number) => PAD_TOP + innerHeight - (value / maxIps) * innerHeight;

  const requests = points.map((point) => point.requests);
  const ips = points.map((point) => point.uniqueIps);
  const linePath = buildPath(requests, xOf, yRequests);
  const areaPath = `${linePath} L${xOf(count - 1).toFixed(2)},${(PAD_TOP + innerHeight).toFixed(2)} L${xOf(0).toFixed(2)},${(PAD_TOP + innerHeight).toFixed(2)} Z`;
  const ipPath = buildPath(ips, xOf, yIps);

  const gridRows = [0, 1, 2, 3];
  const bucketWidth = innerWidth / count;
  // 按像素密度决定刻度间隔：每个标签至少占 56px，避免硬挤
  const tickEvery = Math.max(1, Math.ceil((56 * count) / innerWidth));

  return (
    <svg width={width} height={HEIGHT} role="img" aria-label="访问趋势曲线图" className="block">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" className="text-primary" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" className="text-primary" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {gridRows.map((row) => {
        const y = PAD_TOP + (row / 3) * innerHeight;
        const requestValue = Math.round(maxRequests * (1 - row / 3));
        const ipValue = Math.round(maxIps * (1 - row / 3));
        return (
          <g key={row}>
            <line x1={PAD_LEFT} x2={width - PAD_RIGHT} y1={y} y2={y} className="stroke-border" strokeDasharray="3 5" strokeWidth="1" />
            <text x={PAD_LEFT - 8} y={y + 3.5} textAnchor="end" className="fill-muted-foreground" fontSize="10">{requestValue.toLocaleString()}</text>
            <text x={width - PAD_RIGHT + 8} y={y + 3.5} className="fill-amber-600/80 dark:fill-amber-500/80" fontSize="10">{ipValue.toLocaleString()}</text>
          </g>
        );
      })}

      {points.map((point, index) => (
        index % tickEvery === 0 || index === count - 1 ? (
          <text
            key={`tick-${point.start}`}
            x={xOf(index)}
            y={HEIGHT - 8}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize="10"
          >
            {formatTick(point.start, granularity)}
          </text>
        ) : null
      ))}

      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" className="stroke-primary" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <path d={ipPath} fill="none" className="stroke-amber-500" strokeWidth="1.5" strokeLinejoin="round" opacity="0.9" />

      {points.map((point, index) => (
        <g key={point.start}>
          <circle cx={xOf(index)} cy={yRequests(point.requests)} r="2.5" className="fill-primary" opacity={point.requests ? 1 : 0} />
          <rect x={xOf(index) - bucketWidth / 2} y={PAD_TOP} width={Math.max(bucketWidth, 1)} height={innerHeight} fill="transparent">
            <title>{`${formatFull(point.start, granularity)} · ${point.requests.toLocaleString()} 次拉取 · ${point.uniqueIps} 个唯一 IP`}</title>
          </rect>
        </g>
      ))}
    </svg>
  );
}
