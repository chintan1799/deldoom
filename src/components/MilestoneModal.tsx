import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { Dices, ArrowRight } from 'lucide-react';

interface MilestoneModalProps {
  rollCount: number;
  onDismiss: () => void;
}

const MILESTONES: Record<number, { stat: string; quote: string; attribution: string }> = {
  2: {
    stat: '2 rolls in.',
    quote: 'The important thing is not to stop questioning. Curiosity has its own reason for existing.',
    attribution: 'Albert Einstein',
  },
  5: {
    stat: '5 ideas explored.',
    quote: 'Curiosity is the engine of achievement.',
    attribution: 'Ken Robinson',
  },
  10: {
    stat: '10 rabbit holes discovered.',
    quote: 'The cure for boredom is curiosity. There is no cure for curiosity.',
    attribution: 'Dorothy Parker',
  },
  25: {
    stat: '25 sparks of knowledge.',
    quote: 'I have no special talent. I am only passionately curious.',
    attribution: 'Albert Einstein',
  },
  50: {
    stat: '50 worlds explored.',
    quote: 'Curiosity is one of the permanent and certain characteristics of a vigorous intellect.',
    attribution: 'Samuel Johnson',
  },
  100: {
    stat: 'A century of curiosity.',
    quote: 'Be curious, not judgmental.',
    attribution: 'Walt Whitman',
  },
};

const CONFETTI_DOTS = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  x: Math.random() * 300 - 150,
  y: -(Math.random() * 200 + 100),
  size: Math.random() * 6 + 4,
  color: ['#0f172a', '#1e293b', '#3b82f6', '#94a3b8', '#cbd5e1'][Math.floor(Math.random() * 5)],
  delay: Math.random() * 0.4,
}));

function AnimatedCounter({ value }: { value: number }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 18 });
  const display = useTransform(spring, (v) => Math.round(v).toString());

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return <motion.span>{display}</motion.span>;
}

export function MilestoneModal({ rollCount, onDismiss }: MilestoneModalProps) {
  const milestone = MILESTONES[rollCount];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 8000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  if (!milestone) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="milestone-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-navy-950/80 backdrop-blur-md flex flex-col items-center justify-center px-6"
        onClick={onDismiss}
      >
        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {CONFETTI_DOTS.map((dot) => (
            <motion.div
              key={dot.id}
              initial={{ opacity: 0, x: '50vw', y: '50vh', scale: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: `calc(50vw + ${dot.x}px)`,
                y: `calc(50vh + ${dot.y}px)`,
                scale: [0, 1.2, 1, 0.6],
              }}
              transition={{ delay: dot.delay, duration: 1.2, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: dot.size,
                height: dot.size,
                borderRadius: '50%',
                backgroundColor: dot.color,
              }}
            />
          ))}
        </div>

        {/* Modal card */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm bg-white dark:bg-navy-900 rounded-3xl shadow-2xl px-7 py-8 flex flex-col items-center text-center"
        >
          {/* Dice icon */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.2 }}
            className="w-20 h-20 rounded-[24px] bg-navy-900 dark:bg-white flex items-center justify-center mb-5 shadow-lg"
          >
            <Dices size={38} className="text-white dark:text-navy-900" strokeWidth={1.6} />
          </motion.div>

          {/* Roll count */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-6xl font-black text-navy-900 dark:text-white mb-1 tabular-nums"
          >
            <AnimatedCounter value={rollCount} />
          </motion.div>

          {/* Stat line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-6"
          >
            {milestone.stat}
          </motion.p>

          {/* Quote */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="bg-slate-50 dark:bg-navy-800 rounded-2xl px-5 py-4 mb-7"
          >
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic mb-2">
              "{milestone.quote}"
            </p>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              — {milestone.attribution}
            </p>
          </motion.div>

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            onClick={onDismiss}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-navy-900 dark:bg-white text-white dark:text-navy-900 font-bold text-sm"
          >
            Keep rolling <ArrowRight size={15} strokeWidth={2.5} />
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
