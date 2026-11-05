'use client';

import { CaretDown, ClockCounterClockwise } from '@phosphor-icons/react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { adminService } from '@/services/admin-api';
import type { DynamicHistoryCursor, DynamicHistoryPage } from '@/types/schema/dynamic';
import { formatTraffic } from '@/utils/trafficUtils';

const historyTime = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

function TrafficValue({ bytes }: { bytes: number | null }) {
  return bytes === null ? <span className="text-muted-foreground">未知</span> : formatTraffic(bytes);
}

function HistoryTime({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">未知</span>;
  return <time dateTime={new Date(value).toISOString()}>{historyTime.format(value)}</time>;
}

export function SourceHistory({ superToken, url }: { superToken: string; url: string }) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<DynamicHistoryPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = async (cursor?: DynamicHistoryCursor) => {
    setLoading(true);
    setError(false);
    try {
      const response = await adminService.getSourceHistory(superToken, url, cursor);
      if (response.code !== 0) throw new Error(response.msg);
      setPage((previous) => ({
        records: cursor ? [...(previous?.records ?? []), ...response.data.records] : response.data.records,
        nextCursor: response.data.nextCursor,
      }));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border-y border-border/60 py-2">
      <h3>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 px-2"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => {
            setOpen(!open);
            if (!open && !page && !loading) void load();
          }}
        >
          <ClockCounterClockwise className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          拉取历史
          <CaretDown className={cn('ml-auto h-4 w-4 text-muted-foreground', open && 'rotate-180')} aria-hidden="true" />
        </Button>
      </h3>
      <div id={panelId} hidden={!open} className="pb-2 pt-2">
        {page && page.records.length > 0 && (
          <table className="w-full border-collapse text-left text-xs tabular-nums">
            <caption className="sr-only">订阅源拉取历史，最新记录在前，时间为北京时间</caption>
            <thead className="whitespace-nowrap border-b border-border/60 text-muted-foreground">
              <tr>
                <th scope="col" aria-sort="descending" className="px-2 py-2 font-medium">拉取时间</th>
                <th scope="col" className="px-1 py-2 font-medium">剩余流量</th>
                <th scope="col" className="px-1 py-2 font-medium">总额度</th>
                <th scope="col" className="px-2 py-2 font-medium">到期时间</th>
              </tr>
            </thead>
            <tbody>
              {page.records.map((record) => (
                <tr key={record.id} className="border-b border-border/50 last:border-0">
                  <td className="px-2 py-2.5"><HistoryTime value={record.fetchedAtMs} /></td>
                  <td className="whitespace-nowrap px-1 py-2.5 font-medium"><TrafficValue bytes={record.remainingBytes} /></td>
                  <td className="whitespace-nowrap px-1 py-2.5"><TrafficValue bytes={record.totalBytes} /></td>
                  <td className="px-2 py-2.5"><HistoryTime value={record.expiresAtMs} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {page?.records.length === 0 && <p className="px-2 py-2 text-xs text-muted-foreground">暂无拉取记录</p>}
        {error && <p role="alert" className="px-2 py-2 text-xs text-destructive">拉取历史加载失败，请重试。</p>}
        {loading && <p role="status" className="px-2 py-2 text-xs text-muted-foreground">正在加载拉取历史…</p>}
        {!loading && (error || page?.nextCursor) && (
          <Button variant="outline" size="sm" className="ml-2 mt-2" onClick={() => void load(page?.nextCursor ?? undefined)}>
            {error ? '重试' : '加载更早记录'}
          </Button>
        )}
      </div>
    </section>
  );
}
