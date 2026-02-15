import { copyToClipboard } from '@/utils/configUtils';
import { Button } from '@heroui/react';
import { useState } from 'react';

interface CopyButtonProps {
	/** 要复制的文本内容 */
	text: string;
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

export function CopyButton({
	text,
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
}: CopyButtonProps) {
	const [copySuccess, setCopySuccess] = useState(false);

	const handleCopy = async () => {
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
	};

	return (
		<Button
			onPress={handleCopy}
			color={copySuccess ? 'success' : color}
			variant={variant}
			size={size}
			className={className}
			disabled={disabled}
			startContent={startContent}
			endContent={endContent}
		>
			{copySuccess ? successText : children}
		</Button>
	);
}
