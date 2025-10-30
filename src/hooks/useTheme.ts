import { useState, useEffect } from 'react';
import { safeSetItem, safeGetItem, STORAGE_EXPIRY_TIME } from '../lib/utils';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = safeGetItem('theme');
    if (savedTheme) {
      return savedTheme as Theme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    safeSetItem('theme', theme, STORAGE_EXPIRY_TIME); // 主题设置也只保留30分钟
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };
}