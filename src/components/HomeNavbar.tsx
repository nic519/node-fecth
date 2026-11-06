'use client';

import { ArrowRight } from '@phosphor-icons/react';
import { AcmeLogo } from '@/components/NavigationBar';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';

interface HomeNavbarProps {
  onRegisterClick: () => void;
}

const LINKS = [
  { href: '#product', label: '规则编排' },
  { href: '#sources', label: '多源容灾' },
  { href: '#usage', label: '用量洞察' },
  { href: '#latency', label: '延迟优选' },
  { href: '#features', label: '产品能力' },
];

export function HomeNavbar({ onRegisterClick }: HomeNavbarProps) {
  return (
    <header className="glass-header sticky top-0 z-40 border-b border-border/55">
      <div className="content-container flex h-[72px] items-center gap-6">
        <a href="#top" className="flex items-center gap-3" aria-label="NodeFetch 首页">
          <AcmeLogo className="h-9 w-9" />
          <span className="text-[17px] font-semibold tracking-[-0.025em]">NodeFetch</span>
        </a>
        <nav className="hidden flex-1 items-center justify-center gap-7 md:flex" aria-label="官网导航">
          {LINKS.map((link) => <a key={link.href} href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{link.label}</a>)}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ModeToggle className="border-transparent bg-transparent shadow-none hover:bg-secondary/70" />
          <Button onClick={onRegisterClick} className="h-10 rounded-full px-4">立即使用<ArrowRight weight="bold" className="h-4 w-4" /></Button>
        </div>
      </div>
    </header>
  );
}
