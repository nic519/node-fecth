
'use client';

import { useState, useEffect, useCallback } from 'react';
import { LogEvent, LogLevel } from '@/types/log';
import { formatDateTime } from '@/app/admin/users/utils/userUtils';
import { logApi } from '@/services/log-api';
import { useToastContext } from '@/providers/toast-provider';
import { copyToClipboard } from '@/utils/configUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, RefreshCw, ChevronLeft, ChevronRight, Filter, Clock, AlertTriangle, Tag, MessageSquare, User, Copy, Code, RotateCcw } from "lucide-react";
import { AdminSidePanel } from '@/components/admin/AdminSidePanel';
import { AdminTwoColumnLayout } from '@/components/admin/AdminTwoColumnLayout';
import { LogDetailsDialog } from './LogDetailsDialog';

interface LogViewerProps {
  superToken: string;
}

export function LogViewer({ superToken }: LogViewerProps) {
  const { showToast } = useToastContext();
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Filters
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [level, setLevel] = useState<LogLevel | 'all'>('all');
  const [type, setType] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<LogEvent | null>(null);

  const fetchLogs = useCallback(async (overrides?: Partial<{ page: number; level: LogLevel | 'all'; type: string; userId: string }>) => {
    const effectivePage = overrides?.page ?? page;
    const effectiveLevel = overrides?.level ?? level;
    const effectiveType = overrides?.type ?? type;
    const effectiveUserId = overrides?.userId ?? userId;

    setLoading(true);
    try {
      const response = await logApi.getLogs({
        superToken,
        page: effectivePage,
        pageSize,
        level: effectiveLevel === 'all' ? undefined : effectiveLevel,
        type: effectiveType || undefined,
        userId: effectiveUserId || undefined,
      });

      if (response.code === 0) {
        setLogs(response.data.data);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  }, [superToken, page, pageSize, level, type, userId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = () => {
    setPage(1);
    fetchLogs({ page: 1 });
  };

  const handleReset = () => {
    setPage(1);
    setLevel('all');
    setType('');
    setUserId('');
    fetchLogs({ page: 1, level: 'all', type: '', userId: '' });
  };

  const handleCopy = async (text: string, successMessage: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      showToast(successMessage, 'success');
      return;
    }
    showToast('复制失败', 'error');
  };

  const totalPages = Math.ceil(total / pageSize);
  const hasFilters = level !== 'all' || !!type || !!userId;

  return (
    <>
      <AdminTwoColumnLayout
        sidebar={
          <AdminSidePanel
            title="日志筛选"
            icon={Filter}
            className="h-fit"
            action={
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchLogs}
                disabled={loading}
                className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
                title="刷新列表"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            }
          >
            <div className="space-y-4">
              <div className="bg-muted/30 border border-border/50 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground font-medium mb-1">总记录数</div>
                <div className="text-xl font-bold text-foreground">{total}</div>
              </div>

              {hasFilters && (
                <div className="bg-muted/20 border border-border/40 rounded-lg p-3">
                  <div className="text-xs font-medium text-muted-foreground mb-2">已应用筛选</div>
                  <div className="flex flex-wrap gap-2">
                    {level !== 'all' && (
                      <Badge
                        variant="secondary"
                        className="cursor-pointer select-none"
                        onClick={() => {
                          setPage(1);
                          setLevel('all');
                          fetchLogs({ page: 1, level: 'all' });
                        }}
                        title="点击移除级别筛选"
                      >
                        级别: {level.toUpperCase()}
                      </Badge>
                    )}
                    {!!type && (
                      <Badge
                        variant="secondary"
                        className="cursor-pointer select-none"
                        onClick={() => {
                          setPage(1);
                          setType('');
                          fetchLogs({ page: 1, type: '' });
                        }}
                        title="点击移除事件类型筛选"
                      >
                        类型: {type}
                      </Badge>
                    )}
                    {!!userId && (
                      <Badge
                        variant="secondary"
                        className="cursor-pointer select-none"
                        onClick={() => {
                          setPage(1);
                          setUserId('');
                          fetchLogs({ page: 1, userId: '' });
                        }}
                        title="点击移除用户筛选"
                      >
                        用户: {userId}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">日志级别</label>
                <Select value={level} onValueChange={(v) => setLevel(v as LogLevel | 'all')}>
                  <SelectTrigger className="w-full bg-muted/30 border-border/60 focus:ring-primary/20">
                    <SelectValue placeholder="日志级别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部级别</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warn</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="audit">Audit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">事件类型</label>
                <Input
                  placeholder="输入事件类型..."
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-muted/30 border-border/60 focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">用户ID</label>
                <Input
                  placeholder="输入用户ID..."
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-muted/30 border-border/60 focus-visible:ring-primary/20"
                />
              </div>

              <div className="pt-4 space-y-3 border-t border-border/40">
                <Button
                  onClick={handleSearch}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all"
                >
                  搜索日志
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={loading && logs.length === 0}
                  className="w-full border-border/60"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  重置筛选
                </Button>
              </div>
            </div>
          </AdminSidePanel>
        }
        content={
          <Card className="border-border/60 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm min-h-[600px] flex flex-col">
            <CardContent className="pt-4 flex-1 flex flex-col">
              <TooltipProvider>
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
                      <TableRow className="hover:bg-transparent border-border/60">
                        <TableHead className="w-[180px] font-semibold text-muted-foreground py-2">
                          <span className="inline-flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>时间</span>
                          </span>
                        </TableHead>
                        <TableHead className="w-[100px] font-semibold text-muted-foreground py-2">
                          <span className="inline-flex items-center gap-2">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>级别</span>
                          </span>
                        </TableHead>
                        <TableHead className="w-[150px] font-semibold text-muted-foreground py-2">
                          <span className="inline-flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5" />
                            <span>类型</span>
                          </span>
                        </TableHead>
                        <TableHead className="font-semibold text-muted-foreground py-2">
                          <span className="inline-flex items-center gap-2">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>消息</span>
                          </span>
                        </TableHead>
                        <TableHead className="w-[120px] font-semibold text-muted-foreground py-2">
                          <span className="inline-flex items-center gap-2">
                            <User className="h-3.5 w-3.5" />
                            <span>用户</span>
                          </span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading && logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-64 text-center">
                            <div className="flex flex-col items-center justify-center text-muted-foreground gap-3">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              <span className="text-sm font-medium animate-pulse">正在加载日志数据...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <div className="p-3 bg-muted/50 rounded-full">
                                <RefreshCw className="h-6 w-6 text-muted-foreground/50" />
                              </div>
                              <span>暂无日志数据</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        logs.map((log) => (
                          <TableRow
                            key={log.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors border-border/40 group"
                            onClick={() => setSelectedLog(log)}
                          >
                            <TableCell className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors py-2">
                              {formatDateTime(log.createdAt)}
                            </TableCell>
                            <TableCell className="py-2">
                              <Badge variant={
                                log.level === 'error' ? 'destructive' :
                                  log.level === 'warn' ? 'secondary' :
                                    log.level === 'audit' ? 'outline' : 'default'
                              } className="rounded-md font-normal px-2.5 py-0.5 shadow-sm">
                                {log.level.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs font-medium text-foreground py-2">{log.type}</TableCell>
                            <TableCell className="max-w-[360px] py-2">
                              <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm text-foreground/80 group-hover:text-foreground transition-colors" title={log.message}>
                                    {log.message}
                                  </div>
                                  {log.meta && (
                                    <div className="text-xs text-muted-foreground mt-1 font-mono truncate opacity-60 group-hover:opacity-100 transition-opacity">
                                      {JSON.stringify(log.meta)}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCopy(log.message, '消息已复制到剪贴板');
                                        }}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>复制消息</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        disabled={!log.userId}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!log.userId) return;
                                          handleCopy(log.userId, '用户 ID 已复制到剪贴板');
                                        }}
                                      >
                                        <User className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{log.userId ? '复制用户 ID' : '无用户 ID'}</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCopy(JSON.stringify(log, null, 2), '日志 JSON 已复制到剪贴板');
                                        }}
                                      >
                                        <Code className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>复制 JSON</TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground py-2">{log.userId || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TooltipProvider>

              {/* Pagination */}
              <div className="flex items-center justify-between py-4 mt-auto border-t border-border/40">
                <div className="text-xs font-medium text-muted-foreground pl-2">
                  第 {page} / {totalPages || 1} 页
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="h-8 w-8 p-0 border-border/60 hover:bg-muted"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loading}
                    className="h-8 w-8 p-0 border-border/60 hover:bg-muted"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        }
      />

      <LogDetailsDialog
        log={selectedLog}
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
        onCopy={handleCopy}
      />
    </>
  );
}
