'use client';

import { Badge } from "@/components/ui/badge";
import type { UserAdminConfig } from '@/modules/user/admin.schema';
import { ArrowSquareOut, CalendarBlank, Pulse, UserCircle, WarningCircle } from '@phosphor-icons/react';
import { formatDateTime, formatTraffic, parseTrafficInfo } from '@/utils/trafficUtils';
import { aggregateTraffic, userIssue } from '../utils/userUtils';
import { UserActions } from './UserActions';

interface SubscriptionStatProps {
  stat: NonNullable<UserAdminConfig['subscriptionStats']>[number];
}

function SubscriptionStat({ stat }: SubscriptionStatProps) {
  const trafficInfo = parseTrafficInfo(stat.traffic || null);
  const usagePercent = trafficInfo ? Math.min(100, Math.max(0, trafficInfo.usagePercent)) : 0;

  const displayUrl = (() => {
    if (!stat.url) return '';
    try {
      const u = new URL(stat.url);
      const path = u.pathname && u.pathname !== '/' ? u.pathname : '';
      return `${u.hostname}${path}`;
    } catch {
      return stat.url;
    }
  })();

  const rightTop = (() => {
    if (trafficInfo) {
      return (
        <Badge variant="secondary" className="h-5 px-2 text-[10px] font-normal tabular-nums">
          {trafficInfo.usagePercent.toFixed(1)}%
        </Badge>
      );
    }

    if (stat.lastUpdated && stat.traffic) {
      return <span className="font-mono font-medium text-foreground tabular-nums">{stat.traffic}</span>;
    }

    if (stat.lastUpdated && !stat.traffic) {
      return <span className="text-[10px] text-muted-foreground/70">无流量数据</span>;
    }

    return <span className="text-[10px] text-muted-foreground/70">无数据</span>;
  })();
  return (
    <li className="text-xs py-2 first:pt-0 last:pb-0 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0 bg-muted-foreground/60"
            aria-hidden="true"
          />
          <Badge
            variant="secondary"
            className="h-5 px-1.5 text-[10px] shrink-0 font-normal"
          >
            {stat.name || '订阅源'}
          </Badge>
          {displayUrl ? (
            <span className="min-w-0 truncate font-mono text-[11px] leading-5 text-muted-foreground/80" title={stat.url}>
              {displayUrl}
            </span>
          ) : null}
        </div>

        <div className="shrink-0 flex items-center">{rightTop}</div>
      </div>

      {trafficInfo && (
        <div className="mt-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[10px] text-muted-foreground/70">已用</span>
            <span className="font-mono font-medium text-foreground tabular-nums text-[11px]">
              {formatTraffic(trafficInfo.used)} / {formatTraffic(trafficInfo.total)}
            </span>
          </div>

          <div className="mt-1 h-1 w-full bg-muted/70 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${usagePercent >= 90 ? 'bg-amber-500' : 'bg-primary'}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      )}

      {stat.consumptionRateBytesPerDay != null && stat.consumptionRateBytesPerDay > 0 && (
        <div className="mt-1.5 flex items-baseline justify-between gap-3">
          <span className="text-[10px] text-muted-foreground/70">日均消耗</span>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {formatTraffic(stat.consumptionRateBytesPerDay)}/天
          </span>
        </div>
      )}

      {(trafficInfo?.expire || stat.lastUpdated) && (
        <div className="mt-2 flex justify-between items-center text-[10px] text-muted-foreground/70">
          <span className="truncate">
            {trafficInfo && trafficInfo.expire
              ? `到期 ${new Date(trafficInfo.expire * 1000).toLocaleDateString('zh-CN')}`
              : ''}
          </span>
          <span className="shrink-0">
            {stat.lastUpdated && (
              <span>更新 {new Date(stat.lastUpdated).toLocaleString('zh-CN', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
              })}</span>
            )}
          </span>
        </div>
      )}
    </li>
  );
}

interface UserCardProps {
  user: UserAdminConfig;
  onUserAction: (action: string, uid: string, token?: string) => Promise<void>;
}

export function UserCard({ user, onUserAction }: UserCardProps) {
  const hasSubscriptionStats = user.subscriptionStats && user.subscriptionStats.length > 0;
  const aggregate = aggregateTraffic(user);
  const issue = userIssue(user);

  return (
    <article className="surface group break-inside-avoid p-5 transition-shadow hover:shadow-md">
      <button
        type="button"
        className="mb-4 flex w-full items-center justify-between gap-3 rounded-lg text-left"
        onClick={() => onUserAction('view', user.uid, user.accessToken)}
        aria-label={`打开 ${user.uid} 的用户配置`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary">
            <UserCircle weight="fill" className="h-6 w-6 text-muted-foreground" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-semibold tracking-[-0.02em] transition-colors group-hover:text-primary">{user.uid}</span>
            {issue && (
              <span className={`mt-0.5 flex items-center gap-1 text-[11px] ${issue.kind === 'expired' ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-500'}`}>
                <WarningCircle weight="fill" className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{issue.label} · {issue.detail}</span>
              </span>
            )}
          </span>
        </span>
        <ArrowSquareOut className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
      </button>

      <div className="mb-5 space-y-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Pulse weight="fill" className="h-[18px] w-[18px] text-primary" />
          <span>流量使用情况</span>
        </div>

        {aggregate && (
          <div className="rounded-lg bg-secondary/45 px-3.5 py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[11px] text-muted-foreground">合计剩余</span>
              <span className="text-sm font-semibold tabular-nums tracking-[-0.01em]">
                {formatTraffic(aggregate.remaining)}
                <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">/ 共 {formatTraffic(aggregate.total)}</span>
              </span>
            </div>
            <div className="mt-1.5 h-1 w-full bg-muted/70 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${aggregate.usagePercent >= 90 ? 'bg-amber-500' : 'bg-primary'}`}
                style={{ width: `${Math.min(100, Math.max(0, aggregate.usagePercent))}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground/80">
              {aggregate.available}/{aggregate.remote} 个远程订阅有流量快照
            </p>
          </div>
        )}

        {hasSubscriptionStats ? (
          <ul className="divide-y divide-border/40">
            {user.subscriptionStats!.map((stat, idx) => <SubscriptionStat key={`${stat.url}-${idx}`} stat={stat} />)}
          </ul>
        ) : (
          <div className="rounded-lg bg-secondary/45 px-4 py-5 text-center text-sm text-muted-foreground">
            暂无附加订阅流量快照
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/50 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title="最后修改时间">
          <CalendarBlank className="h-4 w-4 shrink-0" />
          <span>{user.updatedAt ? formatDateTime(user.updatedAt) : '-'}</span>
        </div>
        <UserActions uid={user.uid} onUserAction={onUserAction} />
      </div>
    </article>
  );
}
