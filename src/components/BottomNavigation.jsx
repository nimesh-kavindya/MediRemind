import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, ScanLine, History, HeartPulse, Settings } from 'lucide-react';
import { clsx } from '../utils';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/add-medication', label: 'Add', icon: PlusCircle },
  { path: '/health-tips', label: 'Tips', icon: HeartPulse },
  { path: '/history', label: 'History', icon: History },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-2xl pb-safe z-50 text-slate-800 dark:text-white transition-colors">
      <div className="flex justify-around items-center h-16">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all",
              isActive ? "text-teal-600 dark:text-teal-400 font-bold scale-105" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <item.icon size={22} className={clsx("transition-transform")} />
            <span className="text-[10px] tracking-wide">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
