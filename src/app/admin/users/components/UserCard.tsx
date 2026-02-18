'use client';

import { Badge } from "@/components/ui/badge";
import type { UserAdminConfig } from '@/modules/user/admin.schema';
import { Activity, Calendar, User } from 'lucide-react';
import { formatDateTime, formatTraffic, getTrafficBarColor, parseTrafficInfo } from '../utils/userUtils';
import { UserActions } from './UserActions';

interface SubscriptionStatProps {
  stat: NonNullable<UserAdminConfig['subscriptionStats']>[number];
}

function SubscriptionStat({ stat }: SubscriptionStatProps) {
  const trafficInfo = parseTrafficInfo(stat.traffic || null);
  const usagePercent = trafficInfo ? Math.min(100, Math.max(0, trafficInfo.usagePercent)) : 0;

  // Determine display text for usage
  const renderUsageText = () => {
    if (trafficInfo) {
      return (
        <span className="font-mono font-medium text-foreground">
          <span className="text-muted-foreground/70">已用 </span>
          {formatTraffic(trafficInfo.used)} / {formatTraffic(trafficInfo.total)}
        </span>
      );
    }

    if (stat.lastUpdated && stat.traffic) {
      return <span className="font-mono font-medium text-foreground">{stat.traffic}</span>;
    }

    if (stat.lastUpdated && !stat.traffic) {
      return <span className="text-muted-foreground/70">无流量数据</span>;
    }

    return <span className="text-muted-foreground/70">无数据</span>;
  };

  return (
    <div className="bg-muted/30 rounded-lg p-3 text-xs border border-border/40 hover:border-primary/20 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <Badge
            variant={stat.type === 'main' ? 'default' : 'secondary'}
            className="h-5 px-1.5 text-[10px] shrink-0 font-normal"
          >
            {stat.name || (stat.type === 'main' ? '主' : '附')}
          </Badge>
          <span className="text-muted-foreground truncate font-mono" title={stat.url}>
            {stat.url}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 border-t border-border/40 pt-2 mt-1">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1">
            {renderUsageText()}
          </span>
          <span className="text-[10px] text-muted-foreground/70">
            {trafficInfo ? `${trafficInfo.usagePercent.toFixed(1)}%` : ''}
          </span>
        </div>

        {trafficInfo && (
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${getTrafficBarColor(usagePercent)}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        )}

        <div className="flex justify-between items-center text-[10px] text-muted-foreground/70">
          <span>
            {trafficInfo && trafficInfo.expire
              ? `📅 到期 ${new Date(trafficInfo.expire * 1000).toLocaleDateString()}`
              : ''}
          </span>
          <span>
            {stat.lastUpdated && (
              <span>⏰ 操作 {new Date(stat.lastUpdated).toLocaleString('zh-CN', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
              })}</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

interface UserCardProps {
  user: UserAdminConfig;
  onUserAction: (action: string, uid: string, token?: string) => Promise<void>;
}

export function UserCard({ user, onUserAction }: UserCardProps) {
  const hasSubscriptionStats = user.subscriptionStats && user.subscriptionStats.length > 0;

  return (
    <div className="break-inside-avoid bg-white/80 dark:bg-slate-900/80 rounded-xl shadow-sm border border-border/60 p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-300 backdrop-blur-sm">
      {/* Header: User Info - Clickable */}
      <div
        className="flex items-start justify-between mb-4 group cursor-pointer"
        onClick={() => onUserAction('view', user.uid, user.accessToken)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <User className="h-5 w-5 text-primary" />
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
          <Activity className="h-4 w-4 text-muted-foreground/70" />
          <span>流量使用情况</span>
        </div>

        {hasSubscriptionStats ? (
          <div className="space-y-2.5">
            {user.subscriptionStats!.map((stat, idx) => (
              <SubscriptionStat key={idx} stat={stat} />
            ))}
          </div>
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
