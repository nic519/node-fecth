import { Spinner } from '@heroui/react';
import React from 'react';

interface LoadingProps {
	message?: string;
	size?: 'sm' | 'md' | 'lg';
	fullScreen?: boolean;
	className?: string;
}

const Loading: React.FC<LoadingProps> = ({ message = '加载中...', size = 'md', fullScreen = false, className = '' }) => {
	const containerClasses = fullScreen ? 'min-h-screen bg-gray-100 flex items-center justify-center' : 'flex items-center justify-center';

	return (
		<div className={`${containerClasses} ${className}`}>
			<div className="text-center">
				<Spinner size={size} color="primary" label={message} />
			</div>
		</div>
	);
};

export default Loading;
