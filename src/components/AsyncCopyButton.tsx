import { copyToClipboard } from '@/utils/configUtils';
import { Button, ButtonProps } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface AsyncCopyButtonProps extends Omit<ButtonProps, 'onError' | 'color' | 'variant'> {
	/** 异步获取要复制的文本内容的函数 */
	getText: () => Promise<string | null>;
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

export function AsyncCopyButton({
	getText,
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
			disabled={disabled || isLoading}
			{...props}
		>
			{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
			{startContent && !isLoading && <span className="mr-2 flex items-center">{startContent}</span>}
			{copySuccess ? successText : children}
			{endContent && <span className="ml-2 flex items-center">{endContent}</span>}
		</Button>
	);
}
