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
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm p-4 relative overflow-hidden",
        className
      )}
    >
      {/* Colorful top border for accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-indigo-500 opacity-80" />
      
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/40 pt-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-violet-600 text-white shadow-md shadow-primary/20">
            <Icon className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-base text-foreground tracking-tight">{title}</h2>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
