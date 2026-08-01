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
    primary: "bg-primary text-white hover:bg-secondary focus:ring-primary shadow-lg shadow-primary/30",
    secondary: "bg-blue-50 text-primary hover:bg-blue-100 focus:ring-primary dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700",
    outline: "border-2 border-gray-200 hover:border-primary hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 focus:ring-primary",
    ghost: "hover:bg-gray-100 text-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 focus:ring-gray-500",
    danger: "bg-danger text-white hover:bg-red-600 focus:ring-danger shadow-lg shadow-danger/30"
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
