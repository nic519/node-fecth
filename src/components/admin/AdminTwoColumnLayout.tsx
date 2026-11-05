import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminTwoColumnLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
  className?: string;
}

export function AdminTwoColumnLayout({ sidebar, content, className }: AdminTwoColumnLayoutProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-6 items-start lg:grid-cols-[280px_minmax(0,1fr)]", className)}>
      <div className="min-w-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto scrollbar-hide">
        {sidebar}
      </div>
      <div className="min-w-0">
        {content}
      </div>
    </div>
  );
}
