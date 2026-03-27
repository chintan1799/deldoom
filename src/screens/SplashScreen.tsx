import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center">
      {/* Animated background blobs */}
      <motion.div
        className="absolute w-72 h-72 rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
        animate={{ scale: [1, 1.3, 1], x: [-20, 20, -20] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-64 h-64 rounded-full blur-3xl opacity-15"
        style={{ background: 'radial-gradient(circle, #ec4899, transparent)', top: '40%', left: '60%' }}
        animate={{ scale: [1.2, 0.9, 1.2], y: [-20, 20, -20] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-4 z-10"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
          transition={{ delay: 0.5, duration: 0.8, ease: 'easeInOut' }}
          className="text-7xl"
        >
          🎲
        </motion.div>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-4xl font-black text-white tracking-tight"
        >
          deldoom
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-zinc-400 text-base font-medium"
        >
          learn something new every day
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
            className="w-1.5 h-1.5 bg-zinc-500 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
    </div>
  );
}
