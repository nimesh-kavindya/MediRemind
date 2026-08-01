import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, ScanLine, Settings, LogOut, Calendar as CalendarIcon, User, History, HeartPulse, Bot } from 'lucide-react';
import Logo from './Logo';
import { clsx } from '../utils';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/add-medication', label: 'Add Medication', icon: PlusCircle },
  { path: '/health-tips', label: 'Health Tips', icon: HeartPulse },
  { path: '/history', label: 'Dose History', icon: History },
  { path: '/scanner', label: 'AI Help & Scanner', icon: Bot },
  { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="w-64 h-full bg-white dark:bg-slate-950/95 border-r border-slate-200/80 dark:border-slate-800 backdrop-blur-2xl flex flex-col text-slate-800 dark:text-slate-200 transition-colors">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800/80">
        <Logo size="sm" />
      </div>
      
      <nav className="flex-1 px-3 space-y-1.5 mt-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
              isActive 
                ? "bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 text-slate-950 font-bold shadow-md shadow-teal-500/20" 
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all font-medium text-sm"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
