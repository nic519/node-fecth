/**
 * 用户管理相关的工具函数
 */

/**
 * 格式化流量数据
 * @param bytes 字节数
 * @returns 格式化后的流量字符串
 */
export const formatTraffic = (bytes: number): string => {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化日期时间
 * @param dateStr 日期字符串
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (dateStr: string | null): string => {
	if (!dateStr) return '从未';
	return new Date(dateStr).toLocaleString('zh-CN');
};

/**
 * 获取数据源对应的样式类
 * @param source 数据源类型
 * @returns CSS 类名字符串
 */
export const getSourceClass = (source: string): string => {
	switch (source) {
		case 'kv':
			return 'bg-blue-100 text-blue-800';
		case 'env':
			return 'bg-green-100 text-green-800';
		default:
			return 'bg-gray-100 text-gray-800';
	}
};

/**
 * 获取数据源对应的显示文本
 * @param source 数据源类型
 * @returns 显示文本
 */
export const getSourceText = (source: string): string => {
	switch (source) {
		case 'kv':
			return 'KV 存储';
		case 'env':
			return '环境变量';
		default:
			return '无配置';
	}
};

/**
 * 获取流量使用率对应的进度条颜色
 * @param usagePercent 使用率百分比
 * @returns CSS 类名字符串
 */
export const getTrafficBarColor = (usagePercent: number): string => {
	if (usagePercent > 90) return 'bg-red-500';
	if (usagePercent > 70) return 'bg-yellow-500';
	return 'bg-green-500';
}; 