import { clsx } from '../utils';
import { motion } from 'framer-motion';

export default function Card({ 
  children, 
  className, 
  hoverable = false,
  ...props 
}) {
  const Component = hoverable ? motion.div : 'div';
  const hoverProps = hoverable ? {
    whileHover: { y: -4 },
    transition: { duration: 0.2 }
  } : {};

  return (
    <Component
      className={clsx(
        "bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-slate-200/90 dark:border-slate-800/80 shadow-sm dark:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] text-slate-900 dark:text-slate-100 transition-all",
        hoverable && "cursor-pointer hover:shadow-md hover:border-teal-500/50 dark:hover:border-teal-500/50",
        className
      )}
      {...hoverProps}
      {...props}
    >
      {children}
    </Component>
  );
}
