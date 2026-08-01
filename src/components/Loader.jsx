import { Loader2 } from 'lucide-react';
import { clsx } from '../utils';

export default function Loader({ size = 'md', className, color = 'primary' }) {
  const sizes = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48
  };

  const colors = {
    primary: "text-primary",
    white: "text-white",
    gray: "text-gray-500"
  };

  return (
    <Loader2 
      size={sizes[size]} 
      className={clsx("animate-spin", colors[color], className)} 
    />
  );
}
