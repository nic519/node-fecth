import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PanelTopBarProps {
	description?: ReactNode;
	right?: ReactNode;
	className?: string;
}

export function PanelTopBar({ description, right, className }: PanelTopBarProps) {
	if (!description && !right) return null;

	return (
		<div className={cn("flex items-start justify-between gap-4", className)}>
			{description ? (
				<div className="text-sm text-muted-foreground leading-relaxed">
					{description}
				</div>
			) : (
				<div />
			)}
			{right ? <div className="shrink-0">{right}</div> : null}
		</div>
	);
}
