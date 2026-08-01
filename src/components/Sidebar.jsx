import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, ScanLine, Settings, LogOut, Calendar as CalendarIcon, User } from 'lucide-react';
import Logo from './Logo';
import { clsx } from '../utils';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/add-medication', label: 'Add Medication', icon: PlusCircle },
  { path: '/scanner', label: 'Scanner', icon: ScanLine },
  { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="w-64 h-full bg-card dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex flex-col">
      <div className="p-6">
        <Logo size="sm" />
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
              isActive 
                ? "bg-primary text-white shadow-md shadow-primary/20" 
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-red-50 hover:text-danger dark:hover:bg-red-500/10 transition-all font-medium text-sm"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
