import { Loader2 } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingProps {
	message?: string;
	size?: 'sm' | 'md' | 'lg';
	fullScreen?: boolean;
	className?: string;
}

const Loading: React.FC<LoadingProps> = ({ message = '加载中...', size = 'md', fullScreen = false, className = '' }) => {
	const containerClasses = fullScreen ? 'min-h-screen bg-gray-100 flex flex-col items-center justify-center' : 'flex flex-col items-center justify-center';
    
    const sizeMap = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    }

	return (
		<div className={cn(containerClasses, className)}>
			<div className="text-center flex flex-col items-center gap-2">
				<Loader2 className={cn("animate-spin text-primary", sizeMap[size])} />
                {message && <p className="text-sm text-muted-foreground">{message}</p>}
			</div>
		</div>
	);
};

export default Loading;
