'use client';

import { useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export interface ExpiryCalendarEvent {
	/** 唯一标识（如订阅源 URL） */
	id: string;
	/** 到期时间（毫秒时间戳） */
	dateMs: number;
	/** 主标题（如源名称） */
	title: string;
	/** 副标题（如「3 个用户」「剩余 8 GB」） */
	subtitle?: string;
	/** 已过期 */
	expired?: boolean;
}

interface ExpiryYearCalendarProps {
	events: ExpiryCalendarEvent[];
	/** 点击右侧列表项时触发（如打开详情抽屉） */
	onSelect?: (event: ExpiryCalendarEvent) => void;
	className?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
/** 左侧年历覆盖的月数：本月起往后一年 */
const YEAR_MONTHS = 12;

function dayKeyOf(dateMs: number) {
	const date = new Date(dateMs);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

type Urgency = 'expired' | 'week' | 'month' | 'later';

function urgencyOf(event: ExpiryCalendarEvent, nowMs: number): Urgency {
	if (event.expired || event.dateMs <= nowMs) return 'expired';
	if (event.dateMs - nowMs <= 7 * DAY_MS) return 'week';
	if (event.dateMs - nowMs <= 30 * DAY_MS) return 'month';
	return 'later';
}

const URGENCY_DOT: Record<Urgency, string> = {
	expired: 'bg-muted-foreground/45',
	week: 'bg-red-500',
	month: 'bg-amber-500',
	later: 'bg-primary',
};

const URGENCY_BADGE: Record<Urgency, string> = {
	expired: 'bg-muted text-muted-foreground',
	week: 'bg-red-500/10 text-red-600 dark:text-red-400',
	month: 'bg-amber-500/10 text-amber-600 dark:text-amber-500',
	later: 'bg-secondary text-secondary-foreground',
};

function daysLeftText(event: ExpiryCalendarEvent, nowMs: number) {
	const diff = event.dateMs - nowMs;
	if (diff <= 0) return `已过期 ${Math.max(1, Math.floor(-diff / DAY_MS))} 天`;
	const days = Math.ceil(diff / DAY_MS);
	if (days <= 1) return '明天到期';
	return `剩 ${days} 天`;
}

interface MonthModel {
	year: number;
	month: number;
	leading: number;
	days: number;
}

/**
 * 到期年历：左侧为本月起往后 12 个月的迷你月历（日期上只标点点），
 * 右侧为到期事件列表。点击日期过滤列表，悬停列表项高亮对应日期，双向联动。
 */
export function ExpiryYearCalendar({ events, onSelect, className }: ExpiryYearCalendarProps) {
	const [nowMs] = useState(() => Date.now());
	const [selectedDay, setSelectedDay] = useState<string | null>(null);
	const [hoverDay, setHoverDay] = useState<string | null>(null);
	const listRef = useRef<HTMLDivElement>(null);

	const eventsByDay = useMemo(() => {
		const map = new Map<string, ExpiryCalendarEvent[]>();
		for (const event of events) {
			const key = dayKeyOf(event.dateMs);
			const list = map.get(key);
			if (list) list.push(event);
			else map.set(key, [event]);
		}
		return map;
	}, [events]);

	// 列表按到期时间升序，已过期的沉底
	const sortedEvents = useMemo(() => [...events].sort((a, b) => {
		const expiredA = urgencyOf(a, nowMs) === 'expired' ? 1 : 0;
		const expiredB = urgencyOf(b, nowMs) === 'expired' ? 1 : 0;
		return expiredA - expiredB || a.dateMs - b.dateMs;
	}), [events, nowMs]);

	const visibleEvents = selectedDay
		? sortedEvents.filter((event) => dayKeyOf(event.dateMs) === selectedDay)
		: sortedEvents;

	const months = useMemo<MonthModel[]>(() => {
		const now = new Date(nowMs);
		return Array.from({ length: YEAR_MONTHS }, (_, offset) => {
			const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
			const year = first.getFullYear();
			const month = first.getMonth();
			return {
				year,
				month,
				leading: (first.getDay() + 6) % 7, // 周一开头
				days: new Date(year, month + 1, 0).getDate(),
			};
		});
	}, [nowMs]);

	const todayKey = dayKeyOf(nowMs);

	const handleSelectDay = (key: string) => {
		const next = selectedDay === key ? null : key;
		setSelectedDay(next);
		if (next) {
			// 联动：让列表滚到该天的第一条事件
			listRef.current
				?.querySelector(`[data-day="${next}"]`)
				?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		}
	};

	return (
		<div className={cn('grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]', className)}>
			{/* 左：年历（12 个迷你月） */}
			<div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 xl:grid-cols-4">
				{months.map(({ year, month, leading, days }) => (
					<div key={`${year}-${month}`} className="min-w-0">
						<div className="mb-1.5 flex items-baseline gap-1.5">
							<span className="text-xs font-medium tabular-nums">{month + 1} 月</span>
							<span className="text-[10px] tabular-nums text-muted-foreground/70">{year}</span>
						</div>
						<div className="grid grid-cols-7 gap-px text-center text-[9px] text-muted-foreground/60">
							{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
						</div>
						<div className="mt-0.5 grid grid-cols-7 gap-px">
							{Array.from({ length: leading }, (_, index) => <span key={`blank-${index}`} />)}
							{Array.from({ length: days }, (_, index) => {
								const key = dayKeyOf(new Date(year, month, index + 1).getTime());
								const dayEvents = eventsByDay.get(key) ?? [];
								// 一天可能有多个事件，点颜色取最紧急的
								const urgency = dayEvents.reduce<Urgency | null>((worst, event) => {
									const current = urgencyOf(event, nowMs);
									const order: Urgency[] = ['week', 'month', 'later', 'expired'];
									if (!worst) return current;
									return order.indexOf(current) < order.indexOf(worst) ? current : worst;
								}, null);
								const highlighted = key === selectedDay || key === hoverDay;
								const cell = (
									<>
										<span className={cn(
											'leading-none',
											key === todayKey && 'font-semibold text-foreground',
										)}>
											{index + 1}
										</span>
										{urgency && (
											<span className={cn('absolute inset-x-0 -bottom-0.5 mx-auto h-1 w-1 rounded-full', URGENCY_DOT[urgency])} />
										)}
									</>
								);
								const cellClass = cn(
									'relative flex h-5 items-center justify-center rounded-[4px] text-[9px] tabular-nums text-muted-foreground/75',
									key === todayKey && 'ring-1 ring-foreground/25',
									highlighted && 'bg-accent text-accent-foreground',
									!highlighted && dayEvents.length > 0 && 'cursor-pointer hover:bg-secondary',
								);
								if (dayEvents.length === 0) {
									return <span key={key} className={cellClass}>{cell}</span>;
								}
								return (
									<button
										key={key}
										type="button"
										onClick={() => handleSelectDay(key)}
										onMouseEnter={() => setHoverDay(key)}
										onMouseLeave={() => setHoverDay(null)}
										className={cellClass}
										aria-label={`${key}，${dayEvents.length} 个订阅到期`}
										aria-pressed={selectedDay === key}
									>
										{cell}
									</button>
								);
							})}
						</div>
					</div>
				))}
			</div>

			{/* 右：到期事件列表，与日历联动 */}
			<div className="flex min-h-0 flex-col rounded-xl border border-border/50 bg-muted/20">
				<div className="flex items-center justify-between border-b border-border/50 px-3.5 py-2.5 text-xs">
					<span className="font-medium">
						{selectedDay ? `${selectedDay} · ${visibleEvents.length} 项` : `全部 ${events.length} 项`}
					</span>
					{selectedDay && (
						<button type="button" className="text-muted-foreground transition-colors hover:text-foreground" onClick={() => setSelectedDay(null)}>
							显示全部
						</button>
					)}
				</div>
				<div ref={listRef} className="max-h-64 flex-1 space-y-1 overflow-y-auto p-2 lg:max-h-[330px]">
					{visibleEvents.length === 0 && (
						<p className="px-2 py-6 text-center text-xs text-muted-foreground">
							{selectedDay ? '这一天没有到期事件' : '未来一年没有到期事件'}
						</p>
					)}
					{visibleEvents.map((event) => {
						const key = dayKeyOf(event.dateMs);
						const urgency = urgencyOf(event, nowMs);
						const date = new Date(event.dateMs);
						return (
							<button
								key={`${event.id}-${key}`}
								type="button"
								data-day={key}
								onClick={() => onSelect?.(event)}
								onMouseEnter={() => setHoverDay(key)}
								onMouseLeave={() => setHoverDay(null)}
								className={cn(
									'flex w-full min-w-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-secondary/70',
									hoverDay === key && 'bg-secondary/60',
								)}
							>
								<span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', URGENCY_DOT[urgency])} />
								<span className="min-w-0 flex-1">
									<span className="block truncate text-xs font-medium">{event.title}</span>
									{event.subtitle && <span className="block truncate text-[10px] text-muted-foreground">{event.subtitle}</span>}
								</span>
								<span className="shrink-0 text-right">
									<span className="block text-[11px] tabular-nums text-muted-foreground">
										{date.getMonth() + 1}/{date.getDate()}
									</span>
									<span className={cn('mt-0.5 inline-block rounded-full px-1.5 py-px text-[10px]', URGENCY_BADGE[urgency])}>
										{daysLeftText(event, nowMs)}
									</span>
								</span>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}


