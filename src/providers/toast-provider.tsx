'use client';

import { useCustomToast, type Toast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import React, { createContext, useContext } from 'react';
import { X } from 'lucide-react';

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
		<div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2 w-full max-w-sm px-4">
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
				return { variant: 'outline' as const, className: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100', icon: '✓' };
			case 'error':
				return { variant: 'destructive' as const, className: '', icon: '✕' };
			case 'info':
				return { variant: 'default' as const, className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100', icon: 'ℹ' };
			default:
				return { variant: 'secondary' as const, className: '', icon: 'ℹ' };
		}
	};

	const { variant, className, icon } = getColorAndIcon();

	return (
		<Card
			className="w-full shadow-lg overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300 bg-white dark:bg-slate-950"
		>
			<CardContent className="flex flex-row items-center gap-3 p-3">
				<Badge variant={variant} className={`h-6 w-6 flex items-center justify-center rounded-full p-0 shrink-0 ${className}`}>
					<span className="font-semibold text-xs">{icon}</span>
				</Badge>
				<div className="flex-1">
					<p className="text-sm font-medium text-foreground">{toast.message}</p>
				</div>
				<Button size="icon" variant="ghost" onClick={() => onRemove(toast.id)} className="h-6 w-6 shrink-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
					<X className="h-3 w-3" />
				</Button>
			</CardContent>
		</Card>
	);
}
