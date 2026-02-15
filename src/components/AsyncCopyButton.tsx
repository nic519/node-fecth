import { copyToClipboard } from '@/utils/configUtils';
import { Button } from '@heroui/react';
import { useState } from 'react';

interface AsyncCopyButtonProps {
	/** 异步获取要复制的文本内容的函数 */
	getText: () => Promise<string | null>;
	/** 按钮显示的文本 */
	children?: React.ReactNode;
	/** 复制成功时显示的文本 */
	successText?: string;
	/** 复制失败时的回调 */
	onError?: (error: string) => void;
	/** 复制成功时的回调 */
	onSuccess?: () => void;
	/** 按钮的样式属性 */
	className?: string;
	/** 按钮的颜色 */
	color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
	/** 按钮的变体 */
	variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'ghost';
	/** 按钮的大小 */
	size?: 'sm' | 'md' | 'lg';
	/** 是否禁用按钮 */
	disabled?: boolean;
	/** 开始图标 */
	startContent?: React.ReactNode;
	/** 结束图标 */
	endContent?: React.ReactNode;
}

export function AsyncCopyButton({
	getText,
	children = '复制',
	successText = '已复制！',
	onError,
	onSuccess,
	className,
	color = 'primary',
	variant = 'solid',
	size = 'sm',
	disabled = false,
	startContent,
	endContent,
}: AsyncCopyButtonProps) {
	const [copySuccess, setCopySuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleCopy = async () => {
		setIsLoading(true);
		try {
			const text = await getText();
			if (!text) {
				onError?.('没有可复制的内容');
				return;
			}

			const success = await copyToClipboard(text);
			if (success) {
				setCopySuccess(true);
				onSuccess?.();
				setTimeout(() => setCopySuccess(false), 2000);
			} else {
				onError?.('复制失败');
			}
		} catch (error) {
			onError?.(error instanceof Error ? error.message : '获取内容失败');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button
			onPress={handleCopy}
			color={copySuccess ? 'success' : color}
			variant={variant}
			size={size}
			className={className}
			disabled={disabled || isLoading}
			isLoading={isLoading}
			startContent={startContent}
			endContent={endContent}
		>
			{copySuccess ? successText : children}
		</Button>
	);
}
