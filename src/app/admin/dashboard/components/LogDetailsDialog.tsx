import type { ReactNode } from 'react';
import { LogEvent } from '@/types/log';
import { formatDateTime } from '@/app/admin/users/utils/userUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Code, Copy, Clock, AlertTriangle, Tag, User, Database, Activity } from 'lucide-react';

function getLevelVariant(level: LogEvent['level']) {
  if (level === 'error') return 'destructive';
  if (level === 'warn') return 'secondary';
  if (level === 'audit') return 'outline';
  return 'default';
}

type CopyFn = (text: string, successMessage: string) => void | Promise<void>;

interface LogDetailsDialogProps {
  log: LogEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCopy: CopyFn;
}

function DetailRow({
  onCopy,
  label,
  icon: Icon,
  value,
  copyText,
  copyMessage,
  monospace = true,
}: {
  onCopy: CopyFn;
  label: string;
  icon?: React.ElementType;
  value: ReactNode;
  copyText?: string;
  copyMessage?: string;
  monospace?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-24 shrink-0 pt-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`flex min-w-0 items-start gap-2 text-sm ${monospace ? 'font-mono' : ''}`}>
          <div className={`min-w-0 text-foreground/90 ${monospace ? 'break-all' : 'break-words'}`}>{value}</div>
          {copyText && copyMessage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onCopy(copyText, copyMessage)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>复制</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

export function LogDetailsDialog({ log, open, onOpenChange, onCopy }: LogDetailsDialogProps) {
  const jsonText = log ? JSON.stringify(log, null, 2) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-border/60 shadow-xl">
        <DialogTitle className="sr-only">日志详情</DialogTitle>
        <TooltipProvider>
          {log && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={getLevelVariant(log.level)} className="rounded-md px-2.5 py-0.5 gap-1.5">
                    {log.level === 'error' && <AlertTriangle className="h-3 w-3" />}
                    {log.level === 'warn' && <AlertTriangle className="h-3 w-3" />}
                    {log.level === 'audit' && <Activity className="h-3 w-3" />}
                    {log.level.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-border/60"
                      onClick={() => onCopy(jsonText, '日志 JSON 已复制到剪贴板')}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      复制 JSON
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>复制完整日志对象</TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-4">
                <DetailRow
                  onCopy={onCopy}
                  label="事件"
                  icon={Tag}
                  monospace={false}
                  value={
                    <div className="flex flex-col gap-1">
                      <span className="font-medium leading-relaxed break-words">{log.message}</span>
                      <span className="text-xs text-muted-foreground font-mono break-all">{log.type}</span>
                    </div>
                  }
                  copyText={log.type}
                  copyMessage="类型已复制到剪贴板"
                />
                <DetailRow
                  onCopy={onCopy}
                  label="用户ID"
                  icon={User}
                  value={log.userId || <span className="text-muted-foreground">-</span>}
                  copyText={log.userId || undefined}
                  copyMessage={log.userId ? '用户 ID 已复制到剪贴板' : undefined}
                />
              </div>

              {log.meta && (
                <details open className="rounded-md border border-border/40 bg-muted/20 px-3 py-2 group">
                  <summary className="cursor-pointer select-none text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Database className="h-3.5 w-3.5" />
                    元数据
                  </summary>
                  <div className="pt-2">
                    <pre className="rounded-md bg-slate-950 text-slate-50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
                      {JSON.stringify(log.meta, null, 2)}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          )}
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
