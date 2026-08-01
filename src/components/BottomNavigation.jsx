import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, ScanLine, Calendar as CalendarIcon, Settings } from 'lucide-react';
import { clsx } from '../utils';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/add-medication', label: 'Add', icon: PlusCircle },
  { path: '/scanner', label: 'Scan', icon: ScanLine },
  { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
];

export default function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              isActive ? "text-primary" : "text-gray-500 dark:text-gray-400"
            )}
          >
            <item.icon size={24} className={clsx("transition-transform")} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
