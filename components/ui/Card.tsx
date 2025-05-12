import { FC, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'outline';
  hover?: boolean;
}

const Card: FC<CardProps> = ({ 
  children, 
  className = '',
  variant = 'default',
  hover = false
}) => {
  const baseClasses = 'rounded-xl transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 shadow-sm dark:shadow-md dark:shadow-black/10',
    glass: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-100 dark:border-gray-700',
    outline: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  };
  
  const hoverClasses = hover 
    ? 'hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 hover:scale-[1.01]' 
    : '';

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card; 