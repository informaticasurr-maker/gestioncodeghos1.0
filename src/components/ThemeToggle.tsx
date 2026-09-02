import React from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
  variant?: 'compact' | 'pill' | 'switch';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = false,
  className = '',
  variant = 'compact',
}) => {
  const { companySettings, updateCompanySettings } = useApp();

  const isDark = companySettings.theme === 'dark' || 
    (companySettings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    const nextTheme: 'dark' | 'light' = isDark ? 'light' : 'dark';
    
    // Immediate DOM class update for ultra-smooth responsiveness
    const root = document.documentElement;
    if (nextTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    // Save in localStorage for persistent preference
    localStorage.setItem('techfix_theme', nextTheme);

    // Update global app state
    updateCompanySettings({ theme: nextTheme });
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        id="theme-toggle-pill"
        onClick={toggleTheme}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 text-xs font-semibold shadow-xs ${
          isDark
            ? 'bg-[#0e172a] border-[#223356] text-[#00f2fe] hover:bg-[#13203c] hover:border-[#00f2fe]/40 hover:shadow-[0_0_15px_rgba(0,242,254,0.2)]'
            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-xs'
        } ${className}`}
        title={`Cambiar a Modo ${isDark ? 'Claro' : 'Oscuro'}`}
        aria-label="Alternar modo oscuro y claro"
      >
        <div className="relative w-4 h-4 flex items-center justify-center">
          {isDark ? (
            <Moon className="w-4 h-4 text-[#00f2fe] animate-pulse" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </div>
        <span>{isDark ? 'Modo Oscuro' : 'Modo Claro'}</span>
      </button>
    );
  }

  if (variant === 'switch') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLabel && (
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {isDark ? 'Oscuro' : 'Claro'}
          </span>
        )}
        <button
          type="button"
          id="theme-toggle-switch"
          onClick={toggleTheme}
          className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#00f2fe] focus:ring-offset-2 ${
            isDark ? 'bg-[#00f2fe]/30 border-[#00f2fe]/50' : 'bg-slate-300'
          }`}
          role="switch"
          aria-checked={isDark}
          title={`Cambiar a Modo ${isDark ? 'Claro' : 'Oscuro'}`}
        >
          <span className="sr-only">Alternar tema</span>
          <span
            className={`pointer-events-none flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${
              isDark ? 'translate-x-6 bg-[#090f1d] text-[#00f2fe]' : 'translate-x-0 bg-white text-amber-500'
            }`}
          >
            {isDark ? (
              <Moon className="w-3 h-3 text-[#00f2fe]" />
            ) : (
              <Sun className="w-3 h-3 text-amber-500" />
            )}
          </span>
        </button>
      </div>
    );
  }

  // Default compact button (for Header navbar)
  return (
    <button
      type="button"
      id="theme-toggle-compact"
      onClick={toggleTheme}
      className={`p-2 rounded-lg border transition-all duration-300 flex items-center gap-1.5 text-xs font-medium ${
        isDark
          ? 'bg-[#090f1d] border-[#1e2947] text-[#00f2fe] hover:bg-[#111d38] hover:border-[#00f2fe]/50 hover:shadow-[0_0_15px_rgba(0,242,254,0.25)]'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-xs'
      } ${className}`}
      title={`Cambiar a Modo ${isDark ? 'Claro (Fondo blanco, texto oscuro)' : 'Oscuro (Azul medianoche y cian)'}`}
      aria-label="Alternar tema oscuro y claro"
    >
      <div className="relative">
        {isDark ? (
          <Moon className="w-4 h-4 text-[#00f2fe]" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </div>
      {showLabel && (
        <span className="hidden sm:inline font-semibold">
          {isDark ? 'Oscuro' : 'Claro'}
        </span>
      )}
    </button>
  );
};
