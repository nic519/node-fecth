import { useState, useEffect } from 'preact/hooks';
import { adminApi } from '@/api/client';
import type { SystemStats, SystemInfo, ServiceStatus, SystemLog } from '@/types/user-config';

export function AdminMonitor() {
  const [systemStats, setSystemStats] = useState<SystemStats>({
    cpu: 23,
    memory: 45,
    disk: 67,
    network: 8.5
  });

  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    os: 'Ubuntu 22.04.3 LTS',
    uptime: '89天 15小时 42分钟',
    totalMemory: '32 GB',
    availableMemory: '17.6 GB',
    totalDisk: '2 TB',
    availableDisk: '660 GB'
  });

  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Cloudflare Workers', status: 'running', description: '运行中' },
    { name: 'KV 存储', status: 'running', description: '运行中' },
    { name: '代理节点', status: 'running', description: '25/25 正常' },
    { name: 'CDN 加速', status: 'running', description: '运行中' },
    { name: '监控系统', status: 'running', description: '运行中' },
    { name: '备份服务', status: 'pending', description: '计划中' }
  ]);

  const [recentLogs, setRecentLogs] = useState<SystemLog[]>([
    { time: '2024-01-15 14:35:12', level: 'INFO', message: '用户 premium_001 成功登录' },
    { time: '2024-01-15 14:33:45', level: 'INFO', message: '新用户注册：trial_user_002' },
    { time: '2024-01-15 14:30:22', level: 'WARN', message: 'API 请求频率过高，来源：203.0.113.45' },
    { time: '2024-01-15 14:28:18', level: 'INFO', message: '节点健康检查完成，25个节点正常' },
    { time: '2024-01-15 14:25:33', level: 'INFO', message: '流量统计更新完成' },
    { time: '2024-01-15 14:22:15', level: 'WARN', message: '节点 hk-01 延迟较高：245ms' },
    { time: '2024-01-15 14:20:08', level: 'INFO', message: '系统备份任务完成' },
    { time: '2024-01-15 14:18:45', level: 'ERROR', message: '节点 us-west-02 连接超时，已切换备用节点' },
    { time: '2024-01-15 14:15:30', level: 'INFO', message: '清理过期订阅数据完成' },
    { time: '2024-01-15 14:12:18', level: 'INFO', message: '企业用户 enterprise_client 流量重置' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const superToken = new URLSearchParams(window.location.search).get('superToken') || '';

  useEffect(() => {
    if (!superToken) {
      setError('缺少管理员令牌');
      return;
    }
    loadMonitorData();
  }, [superToken]);

  const loadMonitorData = async () => {
    try {
      setLoading(true);
      // 这里应该从 API 获取真实的监控数据
      // 目前使用模拟数据
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载监控数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'stopped':
        return 'bg-red-100 text-red-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLogLevelClass = (level: string): string => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'WARN':
        return 'bg-yellow-100 text-yellow-800';
      case 'INFO':
        return 'bg-blue-100 text-blue-800';
      case 'DEBUG':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const refreshData = () => {
    loadMonitorData();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 导航栏 */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">系统监控</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a 
                href={`/admin/dashboard?superToken=${superToken}`}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                控制台
              </a>
              <a 
                href={`/admin/users?superToken=${superToken}`}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                用户管理
              </a>
              <a 
                href={`/admin/templates?superToken=${superToken}`}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                配置模板
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* 页面标题 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">系统监控</h2>
            <p className="text-gray-600 mt-1">实时监控系统运行状态和性能指标</p>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          {/* 系统状态卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">CPU 使用率</p>
                  <p className="text-2xl font-bold text-blue-600">{systemStats.cpu}%</p>
                </div>
                <div className="text-3xl">🖥️</div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${systemStats.cpu}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">内存使用</p>
                  <p className="text-2xl font-bold text-green-600">{systemStats.memory}%</p>
                </div>
                <div className="text-3xl">💾</div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${systemStats.memory}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">磁盘使用</p>
                  <p className="text-2xl font-bold text-yellow-600">{systemStats.disk}%</p>
                </div>
                <div className="text-3xl">💿</div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full" 
                    style={{ width: `${systemStats.disk}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">网络流量</p>
                  <p className="text-2xl font-bold text-purple-600">{systemStats.network} MB/s</p>
                </div>
                <div className="text-3xl">🌐</div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(systemStats.network * 2, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 系统信息 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">系统信息</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">操作系统</span>
                  <span className="text-gray-900">{systemInfo.os}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">运行时间</span>
                  <span className="text-gray-900">{systemInfo.uptime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">总内存</span>
                  <span className="text-gray-900">{systemInfo.totalMemory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">可用内存</span>
                  <span className="text-gray-900">{systemInfo.availableMemory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">总磁盘</span>
                  <span className="text-gray-900">{systemInfo.totalDisk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">可用磁盘</span>
                  <span className="text-gray-900">{systemInfo.availableDisk}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">服务状态</h3>
              <div className="space-y-3">
                {services.map((service, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-600">{service.name}</span>
                    <span 
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(service.status)}`}
                    >
                      {service.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 系统日志 */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">系统日志</h3>
              <button 
                onClick={refreshData}
                disabled={loading}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {loading ? '刷新中...' : '刷新'}
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {recentLogs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <span 
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLogLevelClass(log.level)}`}
                    >
                      {log.level}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{log.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <button className="text-blue-600 hover:text-blue-800 text-sm">
                  查看更多日志 →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 