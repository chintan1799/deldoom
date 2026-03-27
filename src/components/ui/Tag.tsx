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
      whileTap={isClickable ? { scale: 0.93 } : {}}
      whileHover={isClickable ? { scale: 1.03 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`
        inline-flex items-center gap-1.5 rounded-2xl font-medium border-2 transition-all
        ${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'}
        ${isClickable ? 'cursor-pointer' : 'cursor-default'}
        ${
          selected
            ? 'border-transparent text-white shadow-lg'
            : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500'
        }
      `}
      style={selected ? { backgroundColor: interest.color } : undefined}
    >
      <span role="img" aria-label={interest.label} className={size === 'sm' ? 'text-sm' : 'text-base'}>
        {interest.emoji}
      </span>
      <span>{interest.label}</span>
      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-0.5 text-white/80"
        >
          ✓
        </motion.span>
      )}
    </motion.button>
  );
}
