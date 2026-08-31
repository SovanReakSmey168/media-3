'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

interface ThemeProviderProps {
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  children: React.ReactNode;
}

function ThemeProvider({ attribute, defaultTheme, enableSystem, disableTransitionOnChange, children }: ThemeProviderProps) {
  return <>{children}</>;
}

export { ThemeProvider };
