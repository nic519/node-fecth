'use client';

import { useEffect } from 'react';

/**
 * 自定义 Hook：设置浏览器标题
 * @param title 页面标题，如果不提供则使用默认标题
 * @param suffix 标题后缀，默认为"节点管理后台"
 */
export function usePageTitle(title?: string, suffix = '节点管理后台') {
	useEffect(() => {
		if (title) {
			document.title = `${title} - ${suffix}`;
		} else {
			document.title = suffix;
		}

		// 组件卸载时恢复默认标题
		return () => {
			document.title = suffix;
		};
	}, [title, suffix]);
}