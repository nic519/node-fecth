import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminTwoColumnLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
  className?: string;
}

export function AdminTwoColumnLayout({ sidebar, content, className }: AdminTwoColumnLayoutProps) {
  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-4 gap-6 items-start", className)}>
      <div className="lg:col-span-1">
        {sidebar}
      </div>
      <div className="lg:col-span-3 min-w-0">
        {content}
      </div>
    </div>
  );
}
