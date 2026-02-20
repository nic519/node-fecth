'use client';

import { Badge } from "@/components/ui/badge";
import type { UserAdminConfig } from '@/modules/user/admin.schema';
import { Activity, Calendar } from 'lucide-react';
import { getUserAvatarPreset } from '../utils/avatarUtils';
import { formatDateTime, formatTraffic, getTrafficBarColor, parseTrafficInfo } from '../utils/userUtils';
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
            className={`h-1.5 w-1.5 rounded-full shrink-0 ${stat.type === 'main' ? 'bg-primary' : 'bg-muted-foreground/60'}`}
            aria-hidden="true"
          />
          <Badge
            variant={stat.type === 'main' ? 'default' : 'secondary'}
            className="h-5 px-1.5 text-[10px] shrink-0 font-normal"
          >
            {stat.name || (stat.type === 'main' ? '主' : '附')}
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
              className={`h-full ${getTrafficBarColor(usagePercent)}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
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
  const { gradientClass: avatarGradientClass, Icon: AvatarIcon } = getUserAvatarPreset(user.uid);

  return (
    <div className="break-inside-avoid bg-white/80 dark:bg-zinc-900/80 rounded-xl shadow-sm border border-border/60 p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-300 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-900/60">
      {/* Header: User Info - Clickable */}
      <div
        className="flex items-start justify-between mb-4 group cursor-pointer"
        onClick={() => onUserAction('view', user.uid, user.accessToken)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 ${avatarGradientClass} rounded-lg shadow-sm group-hover:shadow-md transition-all`}>
            <AvatarIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
              {user.uid}
            </div>
          </div>
        </div>
      </div>

      {/* Body: Stats */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
          <Activity className="h-4 w-4 text-primary" />
          <span>流量使用情况</span>
        </div>

        {hasSubscriptionStats ? (
          <ul className="divide-y divide-border/30">
            {user.subscriptionStats!.map((stat, idx) => (
              <SubscriptionStat key={idx} stat={stat} />
            ))}
          </ul>
        ) : (
          <div className="text-sm text-muted-foreground/60 italic py-2 bg-muted/20 rounded-lg text-center border border-dashed border-border/40">
            暂无订阅数据
          </div>
        )}
      </div>

      {/* Footer: Date & Actions */}
      <div className="pt-4 border-t border-border/40 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70" title="最后修改时间">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{user.updatedAt ? formatDateTime(user.updatedAt) : '-'}</span>
        </div>

        <UserActions
          uid={user.uid}
          onUserAction={onUserAction}
        />
      </div>
    </div>
  );
}
