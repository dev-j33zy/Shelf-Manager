"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

type Theme = 'light' | 'dark' | 'system';

interface Settings {
  theme: Theme;
  devToolsEnabled: boolean;
  logoUrl: string;
  logoIsSvg: boolean;
  churchName: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const defaults: Settings = {
      theme: 'system',
      devToolsEnabled: false,
      logoUrl: '',
      logoIsSvg: false,
      churchName: 'Property of UCCP Sukat Evangelical Church',
    };
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shelf-manager-settings');
      if (saved) {
        try {
          return { ...defaults, ...JSON.parse(saved) };
        } catch {
          // ignore
        }
      }
    }
    return defaults;
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    // Initialize logoUrl from Supabase (global for all users)
    const { data } = supabase.storage.from('logos').getPublicUrl('church-logo.png');
    if (data.publicUrl) {
      setSettings(prev => prev.logoUrl ? prev : { ...prev, logoUrl: data.publicUrl });
    }
    // Load church name from global app_settings
    api.getChurchName().then(name => {
      setSettings(prev => ({ ...prev, churchName: name }));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Don't persist global settings (logoUrl, logoIsSvg, churchName)
    const { logoUrl, logoIsSvg, churchName, ...persisted } = settings;
    localStorage.setItem('shelf-manager-settings', JSON.stringify(persisted));

    // Apply theme
    const root = document.documentElement;
    if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings, mounted]);

  // Also listen for system preference changes if 'system'
  useEffect(() => {
    if (settings.theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      if (e.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Ensure children are wrapped in the Provider even on first render (SSR/hydration)
  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      <div style={{ visibility: mounted ? 'visible' : 'hidden', display: 'contents' }}>
        {mounted && !settings.devToolsEnabled && (
          <style dangerouslySetInnerHTML={{ __html: `
            /* Hide Next.js floating dev tools and build indicators */
            nextjs-portal { display: none !important; }
            #next-build-indicator { display: none !important; }
            [data-nextjs-toast] { display: none !important; }
          ` }} />
        )}
        {children}
      </div>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
