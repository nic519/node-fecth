'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Pulse as Activity,
  ArrowSquareOut,
  FileText,
  Graph,
  House,
  Layout,
  LinkSimple,
  Scroll,
  SignOut,
  UsersThree,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Button } from '@/components/ui/button';
import { useToastContext } from '@/providers/toast-provider';

export interface NavigationBarProps {
  currentPage?: 'dashboard' | 'analytics' | 'sources' | 'users' | 'templates' | 'logs';
  title?: string;
}

export const AcmeLogo = ({ className }: { className?: string }) => (
  <span className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-foreground text-background', className)}>
    <Graph weight="fill" className="h-[55%] w-[55%]" aria-hidden="true" />
  </span>
);

const NAV_ITEMS = [
  { id: 'dashboard', label: '运营总览', icon: Layout, href: '/admin/dashboard' },
  { id: 'analytics', label: '订阅分析', icon: Activity, href: '/admin/analytics' },
  { id: 'sources', label: '订阅源', icon: LinkSimple, href: '/admin/sources' },
  { id: 'users', label: '用户', icon: UsersThree, href: '/admin/users' },
  { id: 'templates', label: '模板', icon: FileText, href: '/admin/templates' },
  { id: 'logs', label: '日志', icon: Scroll, href: '/admin/logs' },
] as const;

export function NavigationBar({ currentPage, title = '运营后台' }: NavigationBarProps) {
  const [signingOut, setSigningOut] = useState(false);
  const { showToast } = useToastContext();

  async function signOut() {
    setSigningOut(true);
    try {
      const response = await fetch('/api/admin/session', { method: 'DELETE' });
      if (!response.ok) throw new Error('退出登录失败');
      window.location.replace('/admin/login');
    } catch {
      showToast('退出登录失败，请稍后重试。', 'error');
      setSigningOut(false);
    }
  }

  return (
    <header className="glass-header sticky top-0 z-40 border-b border-border/60">
      <div className="content-container flex min-h-[72px] flex-wrap items-center gap-x-4 gap-y-0 py-2 lg:flex-nowrap lg:py-0">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-3 lg:flex-none" aria-label="NodeFetch 官网">
          <AcmeLogo className="h-9 w-9" />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold tracking-[-0.02em]">NodeFetch</span>
            <span className="block text-[11px] leading-4 text-muted-foreground">{title}</span>
          </span>
        </Link>

        <nav className="scrollbar-hide order-3 flex w-full items-center gap-1 overflow-x-auto pb-2 lg:order-none lg:w-auto lg:flex-1 lg:justify-center lg:pb-0" aria-label="运营后台导航">
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.id;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-10 shrink-0 items-center gap-2 rounded-[10px] px-3 text-sm font-medium transition-colors',
                  active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                )}
              >
                <Icon weight={active ? 'fill' : 'regular'} className={cn('h-[18px] w-[18px]', active && 'text-primary')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-end gap-1.5">
          <Link
            href="/"
            className="flex h-10 items-center gap-2 rounded-[10px] px-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground sm:px-3"
          >
            <House className="h-[18px] w-[18px]" />
            <span className="hidden xl:inline">官网</span>
            <ArrowSquareOut className="hidden h-3.5 w-3.5 xl:block" />
          </Link>
          <ModeToggle className="border-transparent bg-transparent shadow-none hover:bg-secondary/70" />
          <Button type="button" variant="ghost" size="icon" onClick={signOut} disabled={signingOut} aria-label="退出登录" title="退出登录">
            <SignOut />
          </Button>
        </div>
      </div>
    </header>
  );
}
