import { Bell, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export default function TopAppBar() {
  const { user } = useAuth();

  return (
    <header className="h-16 md:h-20 bg-card/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 sticky top-0 z-40 flex items-center justify-between px-4 md:px-8">
      <div className="md:hidden">
        <Logo size="sm" showText={false} />
      </div>
      <div className="hidden md:block">
        {/* Placeholder for desktop search or breadcrumbs if needed later */}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:text-primary transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-card"></span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user?.name?.charAt(0).toUpperCase() || <User size={16} />}
          </div>
          <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">
            {user?.name || 'User'}
          </span>
        </div>
      </div>
    </header>
  );
}
