import { useEffect, useState } from 'react';

import { dynamicService } from '@/services/dynamic-api';
import type { UsageSeries } from '@/types/api-schemas';

/**
 * 拉取单个订阅源的完整用量序列（用于绘制流量使用曲线）。
 */
export function useUsageSeries(url: string, enabled = true) {
	const [series, setSeries] = useState<UsageSeries | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);

	useEffect(() => {
		if (!enabled || !url) return;
		let cancelled = false;
		// queueMicrotask：避免在 effect 主体内同步 setState 触发级联渲染
		queueMicrotask(() => {
			if (cancelled) return;
			setLoading(true);
			setError(false);
			dynamicService.getUsageHistory(url)
				.then((response) => {
					if (cancelled) return;
					if (response.code === 0) setSeries(response.data);
					else setError(true);
				})
				.catch(() => { if (!cancelled) setError(true); })
				.finally(() => { if (!cancelled) setLoading(false); });
		});
		return () => { cancelled = true; };
	}, [url, enabled]);

	return { series, loading, error };
}
