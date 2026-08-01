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
        "bg-card dark:bg-gray-800 rounded-2xl shadow-soft p-6 border border-gray-100 dark:border-gray-700",
        hoverable && "cursor-pointer hover:shadow-lg transition-shadow",
        className
      )}
      {...hoverProps}
      {...props}
    >
      {children}
    </Component>
  );
}
