import { HeroUIProvider } from '@heroui/react';
import React from 'react';

interface HeroUIProviderWrapperProps {
  children: React.ReactNode;
}

export function HeroUIProviderWrapper({ children }: HeroUIProviderWrapperProps) {
  return (
    <HeroUIProvider>
      {children}
    </HeroUIProvider>
  );
}