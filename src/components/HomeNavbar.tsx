'use client';

import { AcmeLogo } from '@/components/NavigationBar';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface HomeNavbarProps {
  onRegisterClick: () => void;
}

export function HomeNavbar({ onRegisterClick }: HomeNavbarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsVisible(true);
      } else {
        if (currentScrollY > lastScrollY.current) {
          setIsVisible(false); // Hide when scrolling down
        } else {
          setIsVisible(true); // Show when scrolling up
        }
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, []);

  return (
    <nav className={`fixed top-4 left-0 right-0 z-50 flex justify-center transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-[150%]'}`}>
      <div className="flex w-full max-w-6xl items-center justify-between gap-8 px-10 py-3 bg-background/40 backdrop-blur-md border border-border/20 rounded-full shadow-sm">
        <div className="flex items-center gap-2">
          <AcmeLogo className="w-8 h-8 text-primary" />
          <span className="font-bold text-lg tracking-tight">NodeFetch</span>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={onRegisterClick} className="rounded-full"><Sparkles className="w-4 h-4" />立即使用</Button>
          <ModeToggle className="rounded-full bg-transparent border-0 hover:bg-muted/50" />
        </div>
      </div>
    </nav>
  );
}
