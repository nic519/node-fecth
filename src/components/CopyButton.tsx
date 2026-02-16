import { copyToClipboard } from '@/utils/configUtils';
import { Button, ButtonProps } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CopyButtonProps extends Omit<ButtonProps, 'onError' | 'color' | 'variant'> {
	/** 要复制的文本内容 */
	text: string;
	/** 复制成功时显示的文本 */
	successText?: string;
	/** 复制失败时的回调 */
	onError?: (error: string) => void;
	/** 复制成功时的回调 */
	onSuccess?: () => void;
	/** 兼容 HeroUI color 属性 (已废弃，请使用 className) */
	color?: string;
    /** 按钮变体 */
    variant?: ButtonProps['variant'] | 'flat';
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
	variant = 'default',
	size = 'sm',
	disabled = false,
	color,
	startContent,
	endContent,
	...props
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

	// Map HeroUI "flat" variant to "secondary" or "ghost"
	const mappedVariant = (variant as string) === 'flat' ? 'secondary' : variant;

	return (
		<Button
			onClick={handleCopy}
			variant={mappedVariant as ButtonProps['variant']}
			size={size}
			className={cn(
				copySuccess && "bg-green-600 hover:bg-green-700 text-white border-green-600",
				className
			)}
			disabled={disabled}
			{...props}
		>
			{startContent && <span className="mr-2 flex items-center">{startContent}</span>}
			{copySuccess ? successText : children}
			{endContent && <span className="ml-2 flex items-center">{endContent}</span>}
		</Button>
	);
}
