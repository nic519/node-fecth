import type { ReactNode } from 'react';
import { LogEvent } from '@/types/log';
import { formatDateTime } from '@/app/admin/users/utils/userUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Code, Copy } from 'lucide-react';

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
  value,
  copyText,
  copyMessage,
  monospace = true,
}: {
  onCopy: CopyFn;
  label: string;
  value: ReactNode;
  copyText?: string;
  copyMessage?: string;
  monospace?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-16 shrink-0 pt-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`flex min-w-0 items-start gap-2 text-sm ${monospace ? 'font-mono' : ''}`}>
          <div className="min-w-0 break-words text-foreground/90">{value}</div>
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
        <TooltipProvider>
          {log && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                <Badge variant={getLevelVariant(log.level)} className="rounded-md px-2.5 py-0.5">
                  {log.level.toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">
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

              <div className="space-y-2">
                <DetailRow
                  onCopy={onCopy}
                  label="类型"
                  value={log.type}
                  copyText={log.type}
                  copyMessage="类型已复制到剪贴板"
                />
                <DetailRow
                  onCopy={onCopy}
                  label="用户ID"
                  value={log.userId || <span className="text-muted-foreground">-</span>}
                  copyText={log.userId || undefined}
                  copyMessage={log.userId ? '用户 ID 已复制到剪贴板' : undefined}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">消息</div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => onCopy(log.message, '消息已复制到剪贴板')}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        复制
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>复制消息内容</TooltipContent>
                  </Tooltip>
                </div>
                <div className="rounded-md bg-muted/30 px-3 py-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
                  {log.message}
                </div>
              </div>

              {log.meta && (
                <details open className="rounded-md border border-border/40 bg-muted/20 px-3 py-2">
                  <summary className="cursor-pointer select-none text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
