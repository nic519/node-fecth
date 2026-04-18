'use client';

import { NavigationBar } from '@/components/NavigationBar';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LogViewer } from './components/LogViewer';

export function AdminDashboardClient({ superToken }: { superToken: string }) {
  usePageTitle('日志管理');

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950">
      <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-zinc-950 [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#09090b_40%,#1e1b4b_100%)] opacity-20 pointer-events-none" />

      <NavigationBar superToken={superToken} currentPage="dashboard" />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <LogViewer superToken={superToken} />
        </div>
      </main>
    </div>
  );
}
