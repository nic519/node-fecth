(function() {
	let allUsers = [];
	let superToken = '';
	
	// 初始化函数
	function init(token) {
		superToken = token;
		bindEventListeners();
		fetchUsers();
	}
	
	// 从超级管理员 API 获取用户数据
	async function fetchUsers() {
		try {
			console.log('开始获取用户数据...');
			const response = await fetch('/api/admin/users?superToken=' + encodeURIComponent(superToken), {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error('HTTP error! status: ' + response.status);
			}

			const data = await response.json();
			console.log('超级管理员 API 响应:', data);
			
			if (data.success && data.data && data.data.users && Array.isArray(data.data.users)) {
				allUsers = data.data.users;
				renderUsers(allUsers);
				updatePaginationInfo(allUsers.length);
				return data.data.users;
			} else {
				throw new Error(data.error || '获取用户数据失败');
			}
		} catch (err) {
			console.error('获取用户列表失败:', err);
			showError('获取用户数据失败: ' + err.message);
			return [];
		}
	}

	// 格式化流量显示
	function formatTraffic(bytes) {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	// 渲染用户列表
	function renderUsers(users) {
		const tbody = document.getElementById('users-tbody');
		if (!tbody) return;

		tbody.innerHTML = users.map(user => {
			const trafficDisplay = user.trafficInfo ? 
				'<div class="space-y-1">' +
					'<div class="text-xs">' + formatTraffic(user.trafficInfo.used) + ' / ' + formatTraffic(user.trafficInfo.total) + '</div>' +
					'<div class="w-20 bg-gray-200 rounded-full h-1.5">' +
						'<div class="h-1.5 rounded-full ' + 
						(user.trafficInfo.usagePercent > 90 ? 'bg-red-500' :
						 user.trafficInfo.usagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500') + 
						'" style="width: ' + Math.min(user.trafficInfo.usagePercent, 100) + '%"></div>' +
					'</div>' +
					'<div class="text-xs text-gray-500">' + user.trafficInfo.usagePercent.toFixed(1) + '%</div>' +
				'</div>' :
				'<span class="text-gray-400">无数据</span>';

			return '<tr class="hover:bg-gray-50">' +
				'<td class="px-6 py-4 whitespace-nowrap">' +
					'<div class="text-sm font-medium text-gray-900">' + user.userId + '</div>' +
					(user.subscribeUrl ? '<div class="text-xs text-gray-500 truncate max-w-32" title="' + user.subscribeUrl + '">' + user.subscribeUrl + '</div>' : '') +
				'</td>' +
				'<td class="px-6 py-4 whitespace-nowrap">' +
					'<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + 
					(user.hasConfig ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800') + '">' +
						(user.hasConfig ? '已配置' : '未配置') +
					'</span>' +
				'</td>' +
				'<td class="px-6 py-4 whitespace-nowrap">' +
					'<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + getSourceClass(user.source) + '">' +
						getSourceText(user.source) +
					'</span>' +
				'</td>' +
				'<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + 
					trafficDisplay + 
				'</td>' +
				'<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + 
					formatDateTime(user.lastModified) + 
				'</td>' +
				'<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">' +
					'<div class="flex space-x-2">' +
						'<button class="text-blue-600 hover:text-blue-900" data-action="view" data-user-id="' + user.userId + '">查看</button>' +
						'<button class="text-green-600 hover:text-green-900" data-action="edit" data-user-id="' + user.userId + '">编辑</button>' +
						'<button class="text-orange-600 hover:text-orange-900" data-action="refresh" data-user-id="' + user.userId + '">刷新</button>' +
						'<button class="text-red-600 hover:text-red-900" data-action="delete" data-user-id="' + user.userId + '">删除</button>' +
					'</div>' +
				'</td>' +
			'</tr>';
		}).join('');
	}

	// 获取数据源样式类
	function getSourceClass(source) {
		switch(source) {
			case 'kv': return 'bg-blue-100 text-blue-800';
			case 'env': return 'bg-yellow-100 text-yellow-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	// 获取数据源文本
	function getSourceText(source) {
		switch(source) {
			case 'kv': return 'KV';
			case 'env': return 'ENV';
			default: return '无';
		}
	}

	// 格式化时间
	function formatDateTime(dateString) {
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
	}

	// 更新分页信息
	function updatePaginationInfo(count) {
		const info = document.getElementById('pagination-info');
		if (info) {
			info.textContent = '显示 1-' + count + ' 条，共 ' + count + ' 条记录';
		}
	}

	// 显示错误信息
	function showError(message) {
		const tbody = document.getElementById('users-tbody');
		if (tbody) {
			tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-red-600">' + message + '</td></tr>';
		}
	}

	// 搜索和筛选功能
	function filterUsers() {
		const searchTerm = document.getElementById('search-input').value.toLowerCase();
		const statusFilter = document.getElementById('status-filter').value;
		const sourceFilter = document.getElementById('source-filter').value;
		
		const filteredUsers = allUsers.filter(user => {
			const matchesSearch = !searchTerm || 
				user.userId.toLowerCase().includes(searchTerm);
			
			const matchesStatus = !statusFilter || 
				(statusFilter === 'configured' && user.hasConfig) ||
				(statusFilter === 'unconfigured' && !user.hasConfig);
			
			const matchesSource = !sourceFilter || user.source === sourceFilter;
			
			return matchesSearch && matchesStatus && matchesSource;
		});
		
		renderUsers(filteredUsers);
		updatePaginationInfo(filteredUsers.length);
	}

	// 处理用户操作
	function handleUserAction(action, userId) {
		switch(action) {
			case 'view':
				window.open('/admin/users/' + userId + '?superToken=' + encodeURIComponent(superToken), '_blank');
				break;
			case 'edit':
				window.location.href = '/admin/users/' + userId + '/edit?superToken=' + encodeURIComponent(superToken);
				break;
			case 'refresh':
				refreshUserTraffic(userId);
				break;
			case 'delete':
				if (confirm('确定要删除用户 ' + userId + ' 吗？此操作不可撤销！')) {
					deleteUser(userId);
				}
				break;
		}
	}

	// 刷新用户流量
	async function refreshUserTraffic(userId) {
		try {
			const response = await fetch('/api/admin/users/' + userId + '/traffic/refresh?superToken=' + encodeURIComponent(superToken), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const data = await response.json();
			if (data.success) {
				alert('用户 ' + userId + ' 流量信息刷新成功');
				fetchUsers(); // 重新获取数据
			} else {
				alert('刷新失败: ' + data.error);
			}
		} catch (err) {
			alert('刷新失败: ' + err.message);
		}
	}

	// 删除用户
	async function deleteUser(userId) {
		try {
			const response = await fetch('/api/admin/users/' + userId + '?superToken=' + encodeURIComponent(superToken), {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const data = await response.json();
			if (data.success) {
				alert('用户 ' + userId + ' 删除成功');
				fetchUsers(); // 重新获取数据
			} else {
				alert('删除失败: ' + data.error);
			}
		} catch (err) {
			alert('删除失败: ' + err.message);
		}
	}

	// 绑定事件监听器
	function bindEventListeners() {
		// 绑定刷新按钮
		const refreshBtn = document.getElementById('refresh-btn');
		if (refreshBtn) {
			refreshBtn.addEventListener('click', fetchUsers);
		}
		
		// 绑定搜索框
		const searchInput = document.getElementById('search-input');
		if (searchInput) {
			searchInput.addEventListener('input', filterUsers);
		}
		
		// 绑定状态筛选
		const statusFilter = document.getElementById('status-filter');
		if (statusFilter) {
			statusFilter.addEventListener('change', filterUsers);
		}
		
		// 绑定数据源筛选
		const sourceFilter = document.getElementById('source-filter');
		if (sourceFilter) {
			sourceFilter.addEventListener('change', filterUsers);
		}

		// 绑定操作按钮事件委托
		document.addEventListener('click', function(e) {
			if (e.target.hasAttribute('data-action')) {
				e.preventDefault();
				const action = e.target.getAttribute('data-action');
				const userId = e.target.getAttribute('data-user-id');
				handleUserAction(action, userId);
			}
		});
	}

	// 暴露全局接口
	window.UsersPageManager = {
		init: init
	};
})(); 