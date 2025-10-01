import React from 'react';

interface LoadingProps {
	message?: string;
	size?: 'sm' | 'md' | 'lg';
	fullScreen?: boolean;
	className?: string;
}

const Loading: React.FC<LoadingProps> = ({ message = '加载中...', size = 'md', fullScreen = false, className = '' }) => {
	const sizeClasses = {
		sm: 'h-8 w-8',
		md: 'h-12 w-12',
		lg: 'h-16 w-16',
	};

	const containerClasses = fullScreen ? 'min-h-screen bg-gray-100 flex items-center justify-center' : 'flex items-center justify-center';

	return (
		<div className={`${containerClasses} ${className}`}>
			<div className="text-center">
				<div className={`animate-spin rounded-full border-b-2 border-blue-500 mx-auto ${sizeClasses[size]}`}></div>
				<p className="mt-4 text-gray-600">{message}</p>
			</div>
		</div>
	);
};

export default Loading;
