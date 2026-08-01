import { forwardRef } from 'react';
import { clsx } from '../utils';
import { motion } from 'framer-motion';
import Loader from './Loader';

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  isLoading = false,
  className, 
  ...props 
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95";
  
  const variants = {
    primary: "bg-teal-600 dark:bg-teal-500 text-white hover:bg-teal-700 dark:hover:bg-teal-400 focus:ring-teal-500 shadow-md shadow-teal-500/20",
    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-teal-500 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80",
    outline: "border border-slate-200 dark:border-slate-700/80 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-teal-500/80 dark:hover:border-teal-500/80 text-slate-800 dark:text-slate-200 focus:ring-teal-500 shadow-sm",
    ghost: "hover:bg-slate-100/80 text-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/80 focus:ring-teal-500",
    danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-md shadow-rose-500/20"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Loader size="sm" color="white" /> : children}
    </motion.button>
  );
});

Button.displayName = 'Button';
export default Button;
