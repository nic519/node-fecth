import { useCustomToast, type Toast } from '@/hooks/useToast';
import React, { createContext, useContext } from 'react';

interface ToastContextType {
	showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
	toasts: Toast[];
	removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToastContext() {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error('useToastContext must be used within a ToastProvider');
	}
	return context;
}

interface ToastProviderWrapperProps {
	children: React.ReactNode;
}

export function ToastProviderWrapper({ children }: ToastProviderWrapperProps) {
	const { showToast, toasts, removeToast } = useCustomToast();

	return (
		<ToastContext.Provider value={{ showToast, toasts, removeToast }}>
			{children}
			<ToastContainer toasts={toasts} onRemove={removeToast} />
		</ToastContext.Provider>
	);
}

interface ToastContainerProps {
	toasts: Toast[];
	onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
	return (
		<div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
			{toasts.map((toast) => (
				<ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
			))}
		</div>
	);
}

interface ToastItemProps {
	toast: Toast;
	onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
	const getToastStyles = () => {
		switch (toast.type) {
			case 'success':
				return 'bg-green-50 border-green-200 text-green-800';
			case 'error':
				return 'bg-red-50 border-red-200 text-red-800';
			case 'info':
				return 'bg-blue-50 border-blue-200 text-blue-800';
			default:
				return 'bg-gray-50 border-gray-200 text-gray-800';
		}
	};

	const getIcon = () => {
		switch (toast.type) {
			case 'success':
				return (
					<svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
						<path
							fillRule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clipRule="evenodd"
						/>
					</svg>
				);
			case 'error':
				return (
					<svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
						<path
							fillRule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clipRule="evenodd"
						/>
					</svg>
				);
			case 'info':
				return (
					<svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
						<path
							fillRule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
							clipRule="evenodd"
						/>
					</svg>
				);
			default:
				return null;
		}
	};

	return (
		<div
			className={`max-w-sm w-full border rounded-lg shadow-lg p-4 flex items-start space-x-3 ${getToastStyles()}`}
			style={{
				animation: 'slideInDown 0.3s ease-out',
			}}
		>
			<div className="flex-shrink-0">{getIcon()}</div>
			<div className="flex-1">
				<p className="text-sm font-medium">{toast.message}</p>
			</div>
			<button onClick={() => onRemove(toast.id)} className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600">
				<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
					<path
						fillRule="evenodd"
						d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
						clipRule="evenodd"
					/>
				</svg>
			</button>
		</div>
	);
}
