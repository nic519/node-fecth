// 控制台页面的Alpine.js组件
function adminDashboard() {
	return {
		stats: {
			totalUsers: 0,
			activeUsers: 0,
			kvConfigUsers: 0,
			configCompleteRate: 0
		},
		logs: [],
		
		async init() {
			await this.loadStats();
			await this.loadLogs();
		},
		
		async loadStats() {
			try {
				const result = await AdminCommon.makeRequest('/api/admin/stats');
				if (result.success) {
					this.stats = result.data;
				}
			} catch (error) {
				console.error('加载统计数据失败:', error);
				AdminCommon.showError('加载统计数据失败');
			}
		},
		
		async loadLogs() {
			try {
				const result = await AdminCommon.makeRequest('/api/admin/logs', {
					method: 'GET'
				});
				if (result.success) {
					this.logs = result.data.logs;
				}
			} catch (error) {
				console.error('加载日志失败:', error);
				AdminCommon.showError('加载日志失败');
			}
		}
	}
} 