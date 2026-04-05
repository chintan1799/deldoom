import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className = '',
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-colors select-none';

  const variants = {
    primary:   'bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-700 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100',
    secondary: 'bg-slate-100 text-navy-900 hover:bg-slate-200 active:bg-slate-300 dark:bg-navy-800 dark:text-white dark:hover:bg-navy-700',
    ghost:     'bg-transparent text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-navy-800',
  };

  const sizes = {
    sm: 'px-4 py-2.5 text-sm gap-1.5 min-h-[44px]',
    md: 'px-6 py-3 text-base gap-2 min-h-[48px]',
    lg: 'px-8 py-4 text-base font-bold gap-2 min-h-[56px]',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {children}
    </motion.button>
  );
}
