import { useCallback, useState } from 'react';

export interface Toast {
	id: string;
	message: string;
	type: 'success' | 'error' | 'info';
	duration?: number;
}

export function useCustomToast() {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3000) => {
		const id = Math.random().toString(36).substr(2, 9);
		const newToast: Toast = { id, message, type, duration };

		setToasts((prev) => [...prev, newToast]);

		// 自动移除 toast
		setTimeout(() => {
			setToasts((prev) => prev.filter((toast) => toast.id !== id));
		}, duration);
	}, []);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	return {
		showToast,
		toasts,
		removeToast,
	};
}
