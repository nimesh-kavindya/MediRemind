import { Bell, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

export default function TopAppBar() {
  const { user } = useAuth();

  return (
    <header className="h-14 sm:h-16 md:h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-40 flex items-center justify-between px-3 sm:px-6 md:px-8 text-slate-800 dark:text-white transition-colors">
      <div className="md:hidden shrink-0 pr-2">
        <Logo size="sm" showText={true} />
      </div>
      <div className="hidden md:flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
        <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300/80">Health Portal Live</span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <ThemeToggle />
        
        <button className="relative p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-2 h-2 bg-teal-500 dark:bg-teal-400 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3 pl-1.5 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 p-0.5 flex items-center justify-center overflow-hidden shadow-md shrink-0">
            <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold overflow-hidden text-xs sm:text-sm">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || <User size={14} />
              )}
            </div>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
              {user?.name || 'Patient'}
            </span>
            <span className="text-[10px] font-medium text-teal-700 dark:text-teal-300/80">
              {user?.email || 'Active Session'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
