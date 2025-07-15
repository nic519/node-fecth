import { Router, Route } from 'preact-router';
import { UserConfigPage } from '@/pages/UserConfigPage';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { AdminUsers } from '@/pages/admin/Users';
import { AdminMonitor } from '@/pages/admin/Monitor';
import { AdminTemplates } from '@/pages/admin/Templates';
import { NotFound } from '@/pages/NotFound';

export function App() {
  return (
    <Router>
      {/* 用户配置页面 */}
      <Route 
        path="/config/:userId" 
        component={UserConfigPage} 
      />
      
      {/* 管理员页面 */}
      <Route 
        path="/admin/dashboard" 
        component={AdminDashboard} 
      />
      <Route 
        path="/admin/users" 
        component={AdminUsers} 
      />
      <Route 
        path="/admin/monitor" 
        component={AdminMonitor} 
      />
      <Route 
        path="/admin/templates" 
        component={AdminTemplates} 
      />
      
      {/* 默认重定向到管理员控制台 */}
      <Route 
        path="/" 
        component={() => {
          // 检查是否有管理员 token
          const superToken = new URLSearchParams(window.location.search).get('superToken');
          if (superToken) {
            window.location.href = `/admin/dashboard?superToken=${superToken}`;
          } else {
            // 显示说明页面
            return (
              <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">节点管理后台</h1>
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-semibold text-gray-700">用户配置管理</h2>
                      <p className="text-sm text-gray-600">
                        访问: <code className="bg-gray-100 px-1 rounded">/config/用户ID?token=访问令牌</code>
                      </p>
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-700">管理员控制台</h2>
                      <p className="text-sm text-gray-600">
                        访问: <code className="bg-gray-100 px-1 rounded">/admin/dashboard?superToken=管理员令牌</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        }} 
      />
      
      {/* 404 页面 */}
      <Route default component={NotFound} />
    </Router>
  );
} 