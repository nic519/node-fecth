'use client';

import { useCustomToast, type Toast } from '@/hooks/useToast';
import { Button, Card, CardBody, Chip } from '@heroui/react';
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

export function ToastProvider({ children }: ToastProviderWrapperProps) {
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
	const getColorAndIcon = () => {
		switch (toast.type) {
			case 'success':
				return { color: 'success' as const, icon: '✓', label: '成功' };
			case 'error':
				return { color: 'danger' as const, icon: '✕', label: '错误' };
			case 'info':
				return { color: 'primary' as const, icon: 'ℹ', label: '提示' };
			default:
				return { color: 'default' as const, icon: 'ℹ', label: '提示' };
		}
	};

	const { color, icon } = getColorAndIcon();

	return (
		<Card
			className="max-w-sm w-full shadow-lg"
			style={{
				animation: 'slideInDown 0.3s ease-out',
			}}
		>
			<CardBody className="flex flex-row items-start gap-3 p-4">
				<Chip color={color} variant="flat" size="sm" className="mt-0.5">
					<span className="font-semibold">{icon}</span>
				</Chip>
				<div className="flex-1">
					<p className="text-sm font-medium text-gray-700">{toast.message}</p>
				</div>
				<Button isIconOnly size="sm" variant="light" onPress={() => onRemove(toast.id)} className="min-w-6 w-6 h-6">
					<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fillRule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clipRule="evenodd"
						/>
					</svg>
				</Button>
			</CardBody>
		</Card>
	);
}
