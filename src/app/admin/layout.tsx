import type { ReactNode } from 'react';
import { NavigationBar } from '@/components/NavigationBar';
import { hasAdminSession } from '@/server/admin-page';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const hasSession = await hasAdminSession();

  return (
    <div className="flex min-h-dvh flex-col">
      {hasSession && <NavigationBar />}
      {children}
    </div>
  );
}
