
'use client';

import { useState, useEffect } from 'react';
import { LogEvent, LogLevel, LogType, ResourceType } from '@/types/log';
import { ApiResponse } from '@/types/api';
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

interface LogViewerProps {
  superToken: string;
}

export function LogViewer({ superToken }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [level, setLevel] = useState<LogLevel | 'all'>('all');
  const [type, setType] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('superToken', superToken);
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      if (level !== 'all') params.append('level', level);
      if (type) params.append('type', type);
      if (userId) params.append('userId', userId);

      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      const data: ApiResponse<{
        data: LogEvent[];
        total: number;
        page: number;
        pageSize: number;
      }> = await res.json();

      if (data.code === 0) {
        setLogs(data.data.data);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize, level]); // Auto refresh when these change

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>系统日志</CardTitle>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="w-[150px]">
            <Select value={level} onValueChange={(v) => setLevel(v as LogLevel | 'all')}>
              <SelectTrigger>
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

          <div className="w-[150px]">
            <Input
              placeholder="事件类型"
              value={type}
              onChange={(e) => setType(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div className="w-[150px]">
            <Input
              placeholder="用户ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <Button onClick={handleSearch}>搜索</Button>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">时间</TableHead>
                <TableHead className="w-[100px]">级别</TableHead>
                <TableHead className="w-[150px]">类型</TableHead>
                <TableHead>消息</TableHead>
                <TableHead className="w-[120px]">用户</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    暂无日志数据
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        log.level === 'error' ? 'destructive' :
                          log.level === 'warn' ? 'secondary' : // 'warning' variant might not exist, use secondary or default
                            log.level === 'audit' ? 'outline' : 'default'
                      }>
                        {log.level.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.type}</TableCell>
                    <TableCell className="max-w-[300px] truncate" title={log.message}>
                      {log.message}
                      {log.meta && (
                        <div className="text-xs text-gray-400 mt-1 font-mono truncate">
                          {JSON.stringify(log.meta)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.userId || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="text-sm text-gray-500">
            共 {total} 条，第 {page} / {totalPages || 1} 页
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
