'use client';

import { useState } from 'react';
import { Bookmark, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function BookmarkButton({ className }: { className?: string }) {
  const [os] = useState<'mac' | 'win'>(() => {
    if (typeof window === 'undefined') return 'win';
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform) ||
      (navigator.userAgent && navigator.userAgent.includes('Mac'));
    return isMac ? 'mac' : 'win';
  });
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [hintText, setHintText] = useState('添加到书签');
  const [isHovered, setIsHovered] = useState(false);
  const [currentUrl] = useState(() => {
    if (typeof window === 'undefined') return '#';
    return window.location.href;
  });

  const handleClick = () => {
    const shortcut = os === 'mac' ? '⌘+D' : 'Ctrl+D';
    setHintText(`请按 ${shortcut} 收藏`);
    setTooltipOpen(true);

    // 3秒后恢复默认提示
    setTimeout(() => {
      setHintText('添加到书签');
      // 如果鼠标不在上面，则关闭 Tooltip
      if (!isHovered) {
        setTooltipOpen(false);
      }
    }, 3000);
  };

  return (
    <TooltipProvider>
      <Tooltip
        open={tooltipOpen}
        onOpenChange={(open) => {
          // 只允许在 hover 状态下自动打开，点击触发的 open 由 state 控制
          if (hintText === '添加到书签') {
            setTooltipOpen(open);
          }
        }}
        delayDuration={300}
      >
        <TooltipTrigger asChild>
          <div
            className="inline-block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
              setIsHovered(false);
              // 如果提示文字恢复了，鼠标移出时关闭 Tooltip
              if (hintText === '添加到书签') {
                setTooltipOpen(false);
              }
            }}
          >
            <Button
              variant="outline"
              size="icon"
              className={cn("h-8 w-8 relative group", className)}
              onClick={handleClick}
              // 添加拖拽支持
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/uri-list', window.location.href);
                e.dataTransfer.setData('text/plain', window.location.href);
                e.dataTransfer.effectAllowed = 'copyLink';
              }}
            >
              <Bookmark className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="sr-only">添加到书签</span>

              {/* 隐藏的链接，用于某些浏览器的拖拽优化 */}
              <a href={currentUrl} className="absolute inset-0 opacity-0 -z-10" tabIndex={-1} aria-hidden="true">收藏此页</a>
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs font-medium">
          <div className="flex items-center gap-2">
            {hintText !== '添加到书签' && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 animate-pulse" />}
            {hintText}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
