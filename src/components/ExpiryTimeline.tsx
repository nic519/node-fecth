'use client';

import { useState } from 'react';
import { ExpiryBadge } from '@/components/ExpiryBadge';
import { cn } from '@/lib/utils';

export interface ExpiryTimelineEvent {
  id: string;
  dateMs: number;
  title: string;
  subtitle?: string;
  expired?: boolean;
}

function isExpired(event: ExpiryTimelineEvent, now: number) {
  return event.expired || event.dateMs <= now;
}

export function ExpiryTimeline({ events }: { events: ExpiryTimelineEvent[] }) {
  const [now] = useState(() => Date.now());
  const sorted = [...events].sort((a, b) =>
    Number(Boolean(isExpired(a, now))) - Number(Boolean(isExpired(b, now))) || a.dateMs - b.dateMs,
  );
  const groups = new Map<string, ExpiryTimelineEvent[]>();
  for (const event of sorted) {
    const date = new Date(event.dateMs);
    const key = `${isExpired(event, now) ? 'past' : 'future'}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const group = groups.get(key);
    if (group) group.push(event);
    else groups.set(key, [event]);
  }

  if (events.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">暂无订阅到期信息</p>;
  }

  return (
    <ol aria-label="订阅到期时间轴" className="space-y-0">
      {[...groups].map(([key, group]) => {
        const date = new Date(group[0].dateMs);
        return (
          <li key={key} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-4">
            <time dateTime={date.toISOString()} className="pt-3 text-right text-xs tabular-nums">
              <span className="block font-medium">{date.getMonth() + 1} 月 {date.getDate()} 日</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">{date.getFullYear()}</span>
            </time>
            <div className="relative min-w-0 border-l border-border pb-3 pl-4 sm:pl-5">
              <span aria-hidden="true" className="absolute -left-[4.5px] top-4 h-2 w-2 rounded-full bg-muted-foreground ring-4 ring-background" />
              <ul className="divide-y divide-border/50">
                {group.map((event) => {
                  const expired = isExpired(event, now);
                  return (
                    <li key={event.id} className="flex min-w-0 items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className={cn('truncate text-sm font-medium', expired && 'text-muted-foreground')} title={event.title}>{event.title}</p>
                        {event.subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{event.subtitle}</p>}
                      </div>
                      <ExpiryBadge dateMs={event.dateMs} now={now} expired={expired} />
                    </li>
                  );
                })}
              </ul>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
