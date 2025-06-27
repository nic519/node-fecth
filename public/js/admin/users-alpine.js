// 用户管理页面的 Alpine.js 组件逻辑
document.addEventListener('alpine:init', () => {
	Alpine.data('usersManager', (superToken) => ({
		// 数据状态
		allUsers: [],
		filteredUsers: [],
		loading: false,
		error: null,
		superToken: superToken,
		
		// 搜索和筛选状态
		searchTerm: '',
		statusFilter: '',
		sourceFilter: '',
		
		// 初始化
		async init() {
			await this.fetchUsers();
		},
		
		// 获取用户数据
		async fetchUsers() {
			this.loading = true;
			this.error = null;
			try {
				const response = await fetch('/api/admin/users?superToken=' + encodeURIComponent(this.superToken));
				const data = await response.json();
				
				if (data.success && data.data && data.data.users) {
					this.allUsers = data.data.users;
					this.filterUsers();
				} else {
					throw new Error(data.error || '获取用户数据失败');
				}
			} catch (err) {
				this.error = err.message;
				console.error('获取用户列表失败:', err);
			} finally {
				this.loading = false;
			}
		},
		
		// 筛选用户
		filterUsers() {
			this.filteredUsers = this.allUsers.filter(user => {
				const matchesSearch = !this.searchTerm || 
					user.userId.toLowerCase().includes(this.searchTerm.toLowerCase());
				
				const matchesStatus = !this.statusFilter || 
					(this.statusFilter === 'configured' && user.hasConfig) ||
					(this.statusFilter === 'unconfigured' && !user.hasConfig);
				
				const matchesSource = !this.sourceFilter || user.source === this.sourceFilter;
				
				return matchesSearch && matchesStatus && matchesSource;
			});
		},
		
		// 格式化流量
		formatTraffic(bytes) {
			if (bytes === 0) return '0 B';
			const k = 1024;
			const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
			const i = Math.floor(Math.log(bytes) / Math.log(k));
			return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
		},
		
		// 格式化时间
		formatDateTime(dateString) {
			if (!dateString) return '无';
			try {
				const date = new Date(dateString);
				return date.toLocaleString('zh-CN', {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit',
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit'
				});
			} catch {
				return dateString;
			}
		},
		
		// 获取数据源样式
		getSourceClass(source) {
			switch(source) {
				case 'kv': return 'bg-blue-100 text-blue-800';
				case 'env': return 'bg-yellow-100 text-yellow-800';
				default: return 'bg-gray-100 text-gray-800';
			}
		},
		
		// 获取数据源文本
		getSourceText(source) {
			switch(source) {
				case 'kv': return 'KV';
				case 'env': return 'ENV';
				default: return '无';
			}
		},
		
		// 处理用户操作
		handleUserAction(action, userId, token) {
			switch(action) {
				case 'view':
					window.open('/config/' + userId + '?token=' + encodeURIComponent(token), '_blank');
					break; 
				case 'refresh':
					this.refreshUserTraffic(userId);
					break;
				case 'delete':
					if (confirm('确定要删除用户 ' + userId + ' 吗？此操作不可撤销！')) {
						this.deleteUser(userId);
					}
					break;
			}
		},
		
		// 刷新用户流量
		async refreshUserTraffic(userId) {
			try {
				const response = await fetch('/api/admin/users/' + userId + '/traffic/refresh?superToken=' + encodeURIComponent(this.superToken), {
					method: 'POST'
				});
				const data = await response.json();
				
				if (data.success) {
					alert('用户 ' + userId + ' 流量信息刷新成功');
					await this.fetchUsers();
				} else {
					alert('刷新失败: ' + data.error);
				}
			} catch (err) {
				alert('刷新失败: ' + err.message);
			}
		},
		
		// 删除用户
		async deleteUser(userId) {
			try {
				const response = await fetch('/api/admin/users/' + userId + '?superToken=' + encodeURIComponent(this.superToken), {
					method: 'DELETE'
				});
				const data = await response.json();
				
				if (data.success) {
					alert('用户 ' + userId + ' 删除成功');
					await this.fetchUsers();
				} else {
					alert('删除失败: ' + data.error);
				}
			} catch (err) {
				alert('删除失败: ' + err.message);
			}
		},

		// 添加用户功能
		handleAddUser() {
			alert('添加用户功能待实现');
		}
	}));
}); 