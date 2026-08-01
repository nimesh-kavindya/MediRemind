import { HeartPulse } from 'lucide-react';
import { clsx } from '../utils';

export default function Logo({ className, showText = true, size = 'md' }) {
  const sizes = {
    sm: { icon: 24, text: 'text-xl' },
    md: { icon: 32, text: 'text-2xl' },
    lg: { icon: 48, text: 'text-4xl' }
  };

  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <div className="bg-primary/10 p-2 rounded-xl text-primary flex items-center justify-center">
        <HeartPulse size={sizes[size].icon} className="animate-pulse" />
      </div>
      {showText && (
        <span className={clsx("font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent", sizes[size].text)}>
          MediRemind
        </span>
      )}
    </div>
  );
}
