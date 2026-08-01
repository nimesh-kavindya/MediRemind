import { forwardRef } from 'react';
import { clsx } from '../utils';

const Input = forwardRef(({ 
  label, 
  error, 
  icon: Icon,
  className, 
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Icon size={20} />
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            "block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary focus:ring-primary focus:ring-2 focus:outline-none transition-colors sm:text-sm",
            Icon && "pl-10",
            error && "border-danger focus:border-danger focus:ring-danger",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-danger animate-pulse">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
