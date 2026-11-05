'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * 用户卡片骨架：结构对齐 UserCard ——
 * 头像+名称/异常行 → 合计流量块 → 若干订阅行(圆点+胶囊+地址+用量条) → 底部日期与操作。
 */
function UserCardSkeleton({ subscriptions }: { subscriptions: number }) {
  return (
    <div className="surface break-inside-avoid p-5" aria-hidden>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-[18px] w-[18px] shrink-0" />
      </div>

      <div className="mb-5 space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="rounded-lg bg-secondary/45 px-3.5 py-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="mt-2 h-1 w-full rounded-full" />
          <Skeleton className="mt-2 h-2.5 w-32" />
        </div>

        <ul className="divide-y divide-border/40">
          {Array.from({ length: subscriptions }, (_, index) => (
            <li key={index} className="py-2 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Skeleton className="h-1.5 w-1.5 shrink-0 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className={cn('h-3', index % 2 ? 'w-40' : 'w-28')} />
                </div>
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <Skeleton className="h-2.5 w-8" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="mt-1.5 h-1 w-full rounded-full" />
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}

/** 瀑布流骨架：六张卡片，订阅行数错开，模拟真实卡片的参差高度。 */
export function UserMasonrySkeleton() {
  const shapes = [2, 1, 3, 1, 2, 2];
  return (
    <div className="columns-1 gap-6 space-y-6 md:columns-2 xl:columns-3" aria-label="正在加载用户列表">
      {shapes.map((subscriptions, index) => (
        <UserCardSkeleton key={index} subscriptions={subscriptions} />
      ))}
    </div>
  );
}
