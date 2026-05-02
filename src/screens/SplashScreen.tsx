import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dices } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function SplashScreen() {
  const navigate = useNavigate();
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(onboardingComplete ? '/home' : '/onboarding', { replace: true });
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate, onboardingComplete]);

  return (
    <div className="fixed inset-0 bg-navy-950 flex flex-col items-center justify-center">
      {/* Subtle geometric grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-4 z-10"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
          transition={{ delay: 0.5, duration: 0.8, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-[24px] bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/10"
        >
          <Dices size={40} className="text-white" strokeWidth={1.5} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-4xl font-black text-white tracking-tight"
        >
          Lore
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="text-slate-400 text-base font-medium"
        >
          Knowledge with personality.
        </motion.p>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
        className="absolute bottom-16 flex gap-1.5"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 bg-slate-600 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
    </div>
  );
}
