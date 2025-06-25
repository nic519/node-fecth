// 通用导航函数
function navigateWithToken(path) {
	const token = new URLSearchParams(window.location.search).get('superToken');
	window.location.href = path + '?superToken=' + token;
}

// 通用工具函数
const AdminCommon = {
	// 获取超级管理员令牌
	getToken() {
		return new URLSearchParams(window.location.search).get('superToken');
	},

	// 格式化字节大小
	formatBytes(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	},

	// 通用API请求
	async makeRequest(url, options = {}) {
		const token = this.getToken();
		const urlWithToken = url.includes('?') ? 
			`${url}&superToken=${token}` : 
			`${url}?superToken=${token}`;
		
		try {
			const response = await fetch(urlWithToken, options);
			const result = await response.json();
			return result;
		} catch (error) {
			console.error('API请求失败:', error);
			throw error;
		}
	},

	// 显示成功消息
	showSuccess(message) {
		alert(`✓ ${message}`);
	},

	// 显示错误消息
	showError(message) {
		alert(`✗ ${message}`);
	},

	// 确认对话框
	confirm(message) {
		return confirm(message);
	}
}; 