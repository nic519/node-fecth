import { useEffect, useState } from 'preact/hooks';

export function useHelpDisplay() {
	const [showHelp, setShowHelp] = useState(false);
	const [hasUserInteracted, setHasUserInteracted] = useState(false);

	// 响应式控制：大屏幕默认显示帮助，小屏幕默认隐藏
	useEffect(() => {
		const checkScreenSize = () => {
			if (!hasUserInteracted) {
				setShowHelp(window.innerWidth >= 1024);
			}
		};

		checkScreenSize();
		window.addEventListener('resize', checkScreenSize);
		return () => window.removeEventListener('resize', checkScreenSize);
	}, [hasUserInteracted]);

	const toggleHelp = () => {
		setHasUserInteracted(true);
		setShowHelp(!showHelp);
	};

	return {
		showHelp,
		toggleHelp,
	};
} 