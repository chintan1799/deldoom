import { motion, useAnimation } from 'framer-motion';
import { Dices } from 'lucide-react';

interface DiceButtonProps {
  onRoll: () => void;
  loading?: boolean;
}

export function DiceButton({ onRoll, loading = false }: DiceButtonProps) {
  const controls = useAnimation();

  async function handleClick() {
    if (loading) return;
    await controls.start({
      rotate: [0, -18, 18, -10, 10, -4, 4, 0],
      scale:  [1, 1.12, 1.12, 1.06, 1.06, 1.02, 1.02, 1],
      transition: { duration: 0.55, ease: 'easeOut' },
    });
    onRoll();
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={loading}
      whileTap={{ scale: loading ? 1 : 0.93 }}
      className="relative flex flex-col items-center gap-2.5 cursor-pointer select-none disabled:cursor-not-allowed group"
    >
      {/* Pulse ring while loading */}
      {loading && (
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-navy-900 dark:bg-white blur-2xl"
        />
      )}

      {/* Button face */}
      <motion.div
        animate={controls}
        className="relative z-10 w-[72px] h-[72px] rounded-[22px] bg-navy-900 dark:bg-white shadow-xl flex items-center justify-center"
      >
        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
          >
            <Dices size={32} className="text-white dark:text-navy-900" strokeWidth={1.8} />
          </motion.div>
        ) : (
          <Dices size={32} className="text-white dark:text-navy-900" strokeWidth={1.8} />
        )}
      </motion.div>

      <span className="text-sm font-medium text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
        {loading ? 'Rolling…' : 'Roll the dice'}
      </span>
    </motion.button>
  );
}
