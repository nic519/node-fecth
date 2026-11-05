import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminSidePanelProps {
  title: string;
  icon: React.ElementType;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function AdminSidePanel({ title, icon: Icon, children, action, className }: AdminSidePanelProps) {
  return (
    <div className={cn("surface flex flex-col p-4", className)}>
      <div className="mb-4 flex min-h-10 flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Icon className="h-[18px] w-[18px] shrink-0 text-primary" />
          <h2 className="truncate text-[15px] font-semibold tracking-[-0.015em]">{title}</h2>
        </div>
        {action && <div className="ml-auto shrink-0">{action}</div>}
      </div>
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
