import { motion } from 'framer-motion';
import type { InterestCategory } from '../../types';

interface TagProps {
  interest: InterestCategory;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function Tag({ interest, selected = false, onClick, size = 'md' }: TagProps) {
  const isClickable = !!onClick;

  return (
    <motion.button
      onClick={onClick}
      whileTap={isClickable ? { scale: 0.94 } : {}}
      whileHover={isClickable ? { scale: 1.02 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`
        inline-flex items-center gap-1.5 rounded-xl font-medium border transition-all
        ${size === 'sm' ? 'px-3 py-1.5 text-xs min-h-[36px]' : 'px-4 py-2.5 text-sm min-h-[44px]'}
        ${isClickable ? 'cursor-pointer' : 'cursor-default'}
        ${selected
          ? 'bg-navy-900 border-navy-900 text-white dark:bg-white dark:border-white dark:text-navy-900'
          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:bg-navy-800 dark:border-navy-700 dark:text-slate-300 dark:hover:border-slate-500'
        }
      `}
    >
      <span className={size === 'sm' ? 'text-sm' : 'text-base'} aria-hidden>
        {interest.emoji}
      </span>
      <span>{interest.label}</span>
      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-xs opacity-70"
        >
          ✓
        </motion.span>
      )}
    </motion.button>
  );
}
