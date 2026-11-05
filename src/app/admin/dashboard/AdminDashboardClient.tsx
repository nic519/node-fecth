'use client';

import { usePageTitle } from '@/hooks/usePageTitle';
import { LogViewer } from './components/LogViewer';

export function AdminDashboardClient() {
  usePageTitle('日志管理');

  return (
    <div className="flex-1 bg-background">
      <main className="content-container py-7 sm:py-9">
        <div className="space-y-6">
          <LogViewer />
        </div>
      </main>
    </div>
  );
}
