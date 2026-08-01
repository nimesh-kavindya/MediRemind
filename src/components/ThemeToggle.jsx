import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { clsx } from '../utils';

export default function ThemeToggle({ className }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={clsx("flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1", className)}>
      <button
        onClick={() => setTheme('light')}
        className={clsx(
          "p-2 rounded-full transition-all",
          theme === 'light' ? "bg-white shadow-sm text-yellow-500" : "text-gray-400 hover:text-gray-600"
        )}
        aria-label="Light mode"
      >
        <Sun size={18} />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={clsx(
          "p-2 rounded-full transition-all",
          theme === 'system' ? "bg-white dark:bg-gray-700 shadow-sm text-primary" : "text-gray-400 hover:text-gray-600"
        )}
        aria-label="System theme"
      >
        <Monitor size={18} />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={clsx(
          "p-2 rounded-full transition-all",
          theme === 'dark' ? "bg-gray-700 shadow-sm text-blue-400" : "text-gray-400 hover:text-gray-200"
        )}
        aria-label="Dark mode"
      >
        <Moon size={18} />
      </button>
    </div>
  );
}
