import { HeartPulse } from 'lucide-react';
import { clsx } from '../utils';

export default function Logo({ className, showText = true, size = 'md' }) {
  const sizes = {
    sm: { icon: 18, text: 'text-base sm:text-lg', box: 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg' },
    md: { icon: 22, text: 'text-lg sm:text-xl', box: 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl' },
    lg: { icon: 32, text: 'text-2xl sm:text-3xl', box: 'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl' }
  };

  return (
    <div className={clsx("flex items-center gap-2.5 select-none", className)}>
      <div className={clsx("bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-500 p-0.5 shadow-md flex items-center justify-center shrink-0", sizes[size].box)}>
        <div className="w-full h-full rounded-[inherit] bg-white dark:bg-slate-950 flex items-center justify-center text-teal-600 dark:text-teal-400">
          <HeartPulse size={sizes[size].icon} className="animate-pulse" />
        </div>
      </div>
      {showText && (
        <span className={clsx("font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 dark:from-white dark:via-teal-200 dark:to-cyan-300", sizes[size].text)}>
          MediRemind
        </span>
      )}
    </div>
  );
}
