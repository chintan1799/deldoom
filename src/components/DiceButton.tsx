import { motion, useAnimation } from 'framer-motion';

interface DiceButtonProps {
  onRoll: () => void;
  loading?: boolean;
}

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export function DiceButton({ onRoll, loading = false }: DiceButtonProps) {
  const controls = useAnimation();

  async function handleClick() {
    if (loading) return;
    await controls.start({
      rotate: [0, -15, 15, -10, 10, -5, 5, 0],
      scale: [1, 1.15, 1.15, 1.1, 1.1, 1.05, 1.05, 1],
      transition: { duration: 0.5, ease: 'easeOut' },
    });
    onRoll();
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={loading}
      whileTap={{ scale: loading ? 1 : 0.92 }}
      className="relative flex flex-col items-center gap-2 cursor-pointer select-none disabled:cursor-not-allowed group"
    >
      {/* Glow ring */}
      <motion.div
        animate={
          loading
            ? { scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }
            : { scale: 1, opacity: 0 }
        }
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full bg-zinc-900 dark:bg-white blur-xl"
      />

      {/* Dice face */}
      <motion.div
        animate={controls}
        className="relative z-10 w-20 h-20 rounded-3xl bg-zinc-900 dark:bg-white shadow-2xl flex items-center justify-center text-4xl"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
      >
        {loading ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }}
            className="block"
          >
            🎲
          </motion.span>
        ) : (
          <motion.span
            key={Math.random()}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="block"
          >
            🎲
          </motion.span>
        )}
      </motion.div>

      <motion.span
        animate={{ opacity: loading ? 0.5 : 1 }}
        className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors"
      >
        {loading ? 'Rolling...' : 'Roll the dice'}
      </motion.span>
    </motion.button>
  );
}
