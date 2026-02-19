
'use client';

import { useState, useEffect, useCallback } from 'react';
import { LogEvent, LogLevel } from '@/types/log';
import { formatDateTime } from '@/app/admin/users/utils/userUtils';
import { logApi } from '@/services/log-api';
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
import { Loader2, RefreshCw, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { AdminSidePanel } from '@/components/admin/AdminSidePanel';
import { AdminTwoColumnLayout } from '@/components/admin/AdminTwoColumnLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LogViewerProps {
  superToken: string;
}

export function LogViewer({ superToken }: LogViewerProps) {
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

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await logApi.getLogs({
        superToken,
        page,
        pageSize,
        level: level === 'all' ? undefined : level,
        type: type || undefined,
        userId: userId || undefined,
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
    fetchLogs();
  };

  const totalPages = Math.ceil(total / pageSize);

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
              </div>
            </div>
          </AdminSidePanel>
        }
        content={
          <Card className="border-border/60 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm min-h-[600px] flex flex-col">
            <CardContent className="pt-4 flex-1 flex flex-col">
              {/* Table */}
              <div className="flex-1 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/60">
                      <TableHead className="w-[180px] font-semibold text-muted-foreground py-2">时间</TableHead>
                      <TableHead className="w-[100px] font-semibold text-muted-foreground py-2">级别</TableHead>
                      <TableHead className="w-[150px] font-semibold text-muted-foreground py-2">类型</TableHead>
                      <TableHead className="font-semibold text-muted-foreground py-2">消息</TableHead>
                      <TableHead className="w-[120px] font-semibold text-muted-foreground py-2">用户</TableHead>
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
                          <TableCell className="max-w-[300px] py-2">
                            <div className="truncate text-sm text-foreground/80 group-hover:text-foreground transition-colors" title={log.message}>
                              {log.message}
                            </div>
                            {log.meta && (
                              <div className="text-xs text-muted-foreground mt-1 font-mono truncate opacity-60 group-hover:opacity-100 transition-opacity">
                                {JSON.stringify(log.meta)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground py-2">{log.userId || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

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

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto border-border/60 shadow-xl">
          <DialogHeader className="border-b border-border/40 pb-4 mb-4">
            <DialogTitle className="text-xl font-bold">日志详情</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <h3 className="font-medium text-xs uppercase tracking-wider text-muted-foreground">时间</h3>
                  <p className="font-mono text-sm bg-muted/50 p-2 rounded-md border border-border/40">{formatDateTime(selectedLog.createdAt)}</p>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-medium text-xs uppercase tracking-wider text-muted-foreground">级别</h3>
                  <div>
                    <Badge variant={
                      selectedLog.level === 'error' ? 'destructive' :
                        selectedLog.level === 'warn' ? 'secondary' :
                          selectedLog.level === 'audit' ? 'outline' : 'default'
                    } className="rounded-md px-3 py-1">
                      {selectedLog.level.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-medium text-xs uppercase tracking-wider text-muted-foreground">类型</h3>
                  <p className="font-mono text-sm bg-muted/50 p-2 rounded-md border border-border/40">{selectedLog.type}</p>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-medium text-xs uppercase tracking-wider text-muted-foreground">用户 ID</h3>
                  <p className="font-mono text-sm bg-muted/50 p-2 rounded-md border border-border/40">{selectedLog.userId || '-'}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-medium text-xs uppercase tracking-wider text-muted-foreground">消息</h3>
                <div className="bg-muted/50 p-4 rounded-lg border border-border/40 overflow-x-auto whitespace-pre-wrap font-mono text-sm text-foreground/90">
                  {selectedLog.message}
                </div>
              </div>

              {selectedLog.meta && (
                <div className="space-y-1.5">
                  <h3 className="font-medium text-xs uppercase tracking-wider text-muted-foreground">元数据</h3>
                  <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg border border-border/40 overflow-x-auto font-mono text-xs leading-relaxed">
                    {JSON.stringify(selectedLog.meta, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
