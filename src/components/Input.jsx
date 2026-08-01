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
            "block w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/80 px-4 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all sm:text-sm leading-normal",
            Icon && "pl-10",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
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
