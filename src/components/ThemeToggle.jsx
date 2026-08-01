import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { clsx } from '../utils';

export default function ThemeToggle({ className }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={clsx("flex items-center bg-slate-200/80 dark:bg-slate-800/80 rounded-full p-0.5 sm:p-1 border border-slate-300/60 dark:border-slate-700/60 backdrop-blur-md shrink-0", className)}>
      <button
        onClick={() => setTheme('light')}
        className={clsx(
          "p-1 sm:p-1.5 rounded-full transition-all flex items-center justify-center",
          theme === 'light' 
            ? "bg-white shadow-md text-amber-500 scale-105" 
            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        )}
        aria-label="Light mode"
        title="Light Mode"
      >
        <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={clsx(
          "p-1 sm:p-1.5 rounded-full transition-all flex items-center justify-center",
          theme === 'system' 
            ? "bg-white dark:bg-slate-700 shadow-md text-teal-600 dark:text-teal-400 scale-105" 
            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        )}
        aria-label="System theme"
        title="System Preference"
      >
        <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={clsx(
          "p-1 sm:p-1.5 rounded-full transition-all flex items-center justify-center",
          theme === 'dark' 
            ? "bg-slate-900 shadow-md text-cyan-400 scale-105" 
            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        )}
        aria-label="Dark mode"
        title="Dark Mode"
      >
        <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    </div>
  );
}
