import { motion } from 'framer-motion';
import { clsx } from '../utils';

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx("flex flex-col items-center justify-center p-12 text-center", className)}
    >
      <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-full mb-4">
        {Icon && <Icon size={32} className="text-primary" />}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
        {description}
      </p>
      {action}
    </motion.div>
  );
}
