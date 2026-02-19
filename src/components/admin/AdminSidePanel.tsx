import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface AdminSidePanelProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function AdminSidePanel({ title, icon: Icon, children, action, className }: AdminSidePanelProps) {
  return (
    <div className={cn("bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-5 rounded-xl shadow-sm border border-border/60 sticky top-24 z-10", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-primary to-violet-600 rounded-lg shadow-md">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <h2 className="font-semibold text-foreground">{title}</h2>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
