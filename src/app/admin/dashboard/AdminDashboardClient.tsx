'use client';

import { NavigationBar } from '@/components/NavigationBar';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LogViewer } from './components/LogViewer';

export function AdminDashboardClient({ superToken }: { superToken: string }) {
  usePageTitle('日志管理');

  return (
    <div className="min-h-100dvh bg-background">
      <NavigationBar superToken={superToken} currentPage="logs" />

      <main className="content-container py-7 sm:py-9">
        <div className="space-y-6">
          <LogViewer superToken={superToken} />
        </div>
      </main>
    </div>
  );
}
