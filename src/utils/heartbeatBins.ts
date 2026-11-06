/**
 * IP 心跳格子条的纯聚合逻辑：把心跳时间戳聚合到固定数量的桶里。
 *
 * 两种窗口：
 * - 1 天：24 个等分小时桶，覆盖 [结束时间 - 24h, 结束时间]；
 * - 14 天：14 个按本地自然日对齐的天桶，最后一桶为结束时间所在的当天。
 */

/** 心跳格子条的时间窗口（天）：1 = 最近 24 小时，14 = 最近 14 天 */
export type HeartbeatWindowDays = 1 | 14;

export interface HeartbeatBins {
  /** 桶粒度：1 天窗口按小时，14 天窗口按天 */
  granularity: 'hour' | 'day';
  /** 每个桶的开始时间（ISO 字符串），与 counts 一一对应 */
  starts: string[];
  /** 每个桶内的心跳次数 */
  counts: number[];
}

const HOUR_BINS = 24;
const DAY_BINS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

function clampIndex(value: number, bins: number) {
  return Math.min(bins - 1, Math.max(0, value));
}

/** 1 天窗口：沿用旧版做法，把窗口等分为 24 份。 */
function buildHourlyBins(timestamps: string[], startMs: number, endMs: number): HeartbeatBins {
  const duration = Math.max(1, endMs - startMs);
  const starts = Array.from({ length: HOUR_BINS }, (_, index) =>
    new Date(startMs + (duration / HOUR_BINS) * index).toISOString());
  const counts = Array.from({ length: HOUR_BINS }, () => 0);

  for (const timestamp of timestamps) {
    const at = Date.parse(timestamp);
    if (!Number.isFinite(at)) continue;
    const index = clampIndex(Math.floor(((at - startMs) / duration) * HOUR_BINS), HOUR_BINS);
    counts[index] += 1;
  }
  return { granularity: 'hour', starts, counts };
}

/** 14 天窗口：按本地自然日对齐，用 Date(y, m, d - n) 回溯以正确处理跨月与夏令时。 */
function buildDailyBins(timestamps: string[], endMs: number): HeartbeatBins {
  const end = new Date(endMs);
  const dayStarts = Array.from({ length: DAY_BINS }, (_, index) =>
    new Date(end.getFullYear(), end.getMonth(), end.getDate() - (DAY_BINS - 1 - index)).getTime());
  const counts = Array.from({ length: DAY_BINS }, () => 0);

  for (const timestamp of timestamps) {
    const at = Date.parse(timestamp);
    if (!Number.isFinite(at)) continue;
    // 桶数固定为 14，倒序找最后一个开始时间早于心跳的桶即可
    let index = 0;
    for (let bucket = DAY_BINS - 1; bucket >= 0; bucket -= 1) {
      if (at >= dayStarts[bucket]) {
        index = bucket;
        break;
      }
    }
    // 窗口之前的零星记录并入第一桶，与小时桶的越界策略保持一致
    counts[clampIndex(index, DAY_BINS)] += 1;
  }
  return { granularity: 'day', starts: dayStarts.map((at) => new Date(at).toISOString()), counts };
}

/**
 * 把心跳时间戳聚合成格子条桶：
 * - windowDays = 1 时为 24 个等分小时桶；
 * - windowDays = 14 时为 14 个本地自然日桶（覆盖结束时间所在日起往前 14 天）。
 */
export function buildHeartbeatBins(
  timestamps: string[],
  windowEndMs: number,
  windowDays: HeartbeatWindowDays,
): HeartbeatBins {
  if (windowDays === 14) return buildDailyBins(timestamps, windowEndMs);
  return buildHourlyBins(timestamps, windowEndMs - DAY_MS, windowEndMs);
}
