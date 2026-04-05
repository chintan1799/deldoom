import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, Dices } from 'lucide-react';
import { INTERESTS, INTEREST_GROUPS } from '../data/interests';
import { Tag } from '../components/ui/Tag';
import { Button } from '../components/ui/Button';
import { ProgressDots } from '../components/ui/ProgressDots';
import { useAppStore } from '../store/useAppStore';

const MIN_INTERESTS = 3;
const STEPS = 3;

const stepVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
};

export function OnboardingScreen() {
  const navigate = useNavigate();
  const { selectedInterests, toggleInterest, completeOnboarding } = useAppStore();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const filteredInterests = useMemo(() => {
    let list = INTERESTS;
    if (activeGroup) list = list.filter((i) => i.group === activeGroup);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          i.group.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, activeGroup]);

  function go(nextStep: number) {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  }

  function handleFinish() {
    completeOnboarding();
    navigate('/home', { replace: true });
  }

  const canProceed = selectedInterests.length >= MIN_INTERESTS;

  return (
    <div className="fixed inset-0 bg-white dark:bg-navy-950 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-12 pb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-navy-900 dark:bg-white flex items-center justify-center">
            <Dices size={16} className="text-white dark:text-navy-900" strokeWidth={1.8} />
          </div>
          <span className="font-black text-xl text-navy-900 dark:text-white tracking-tight">deldoom</span>
        </div>
        <ProgressDots total={STEPS} current={step} />
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence custom={direction} mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
                className="w-24 h-24 rounded-[28px] bg-navy-900 dark:bg-white flex items-center justify-center mb-8 shadow-2xl"
              >
                <Dices size={44} className="text-white dark:text-navy-900" strokeWidth={1.5} />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-black text-navy-900 dark:text-white mb-4 leading-tight"
              >
                Turn scrolling into learning
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-slate-500 dark:text-slate-400 text-base mb-10 leading-relaxed text-left max-w-xs"
              >
                <span className="font-black italic text-navy-900 dark:text-white">deldoom</span>
                {'  '}
                <span className="text-slate-400 text-sm not-italic">/ del·doom /  verb</span>
                <br /><br />
                "the activity of gradually deleting doomscrolling from your life and taking control of your time, one nano-learning dice roll at a time. One roll. One idea. One goal: Pursuit of Knowledge."
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-xs"
              >
                <Button onClick={() => go(1)} size="lg" fullWidth>
                  Let's go →
                </Button>
              </motion.div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Header */}
              <div className="px-6 pt-2 pb-3 shrink-0">
                <h2 className="text-2xl font-black text-navy-900 dark:text-white mb-1">
                  What sparks your curiosity?
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Pick at least {MIN_INTERESTS}. We'll roll content just for you.
                </p>
              </div>

              {/* Search bar */}
              <div className="px-6 pb-3 shrink-0">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={2} />
                  <input
                    type="text"
                    placeholder="Search interests..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-navy-800 rounded-xl text-sm text-navy-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-navy-900/20 dark:focus:ring-white/10 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Group filter chips */}
              {!search && (
                <div className="px-6 pb-3 shrink-0 overflow-x-auto">
                  <div className="flex gap-2 w-max">
                    <button
                      onClick={() => setActiveGroup(null)}
                      className={`px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
                        !activeGroup
                          ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-900'
                          : 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-400'
                      }`}
                    >
                      All
                    </button>
                    {INTEREST_GROUPS.map((group) => (
                      <button
                        key={group}
                        onClick={() => setActiveGroup(activeGroup === group ? null : group)}
                        className={`px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
                          activeGroup === group
                            ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-900'
                            : 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-400'
                        }`}
                      >
                        {group}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Interest grid */}
              <div className="flex-1 overflow-y-auto px-6 pb-36">
                <motion.div className="flex flex-wrap gap-2.5 py-1">
                  <AnimatePresence mode="popLayout">
                    {filteredInterests.map((interest, i) => (
                      <motion.div
                        key={interest.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                          delay: Math.min(i * 0.02, 0.3),
                          type: 'spring',
                          stiffness: 300,
                          damping: 25,
                        }}
                      >
                        <Tag
                          interest={interest}
                          selected={selectedInterests.includes(interest.id)}
                          onClick={() => toggleInterest(interest.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Bottom CTA — sticky, respects safe area */}
              <div
                className="sticky bottom-0 left-0 right-0 px-6 py-5 bg-white/95 dark:bg-navy-950/95 backdrop-blur-xl border-t border-slate-100 dark:border-navy-800"
                style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedInterests.length === 0
                      ? `Pick at least ${MIN_INTERESTS}`
                      : `${selectedInterests.length} selected`}
                  </span>
                  {selectedInterests.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`text-sm font-semibold ${canProceed ? 'text-navy-900 dark:text-white' : 'text-slate-400'}`}
                    >
                      {canProceed ? 'Ready!' : `${MIN_INTERESTS - selectedInterests.length} more to go`}
                    </motion.span>
                  )}
                </div>
                <Button onClick={() => go(2)} disabled={!canProceed} fullWidth size="lg">
                  Continue →
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                className="w-24 h-24 rounded-[28px] bg-navy-900 dark:bg-white flex items-center justify-center mb-8 shadow-2xl"
              >
                <Dices size={44} className="text-white dark:text-navy-900" strokeWidth={1.5} />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-black text-navy-900 dark:text-white mb-4"
              >
                You're all set!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-slate-500 dark:text-slate-400 text-base mb-4 leading-relaxed"
              >
                We'll roll articles from your{' '}
                <strong className="text-navy-900 dark:text-white">{selectedInterests.length} topics</strong>.
                The more you explore, the better it gets.
              </motion.p>

              {/* Selected interests preview */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-2 justify-center mb-10 max-w-sm"
              >
                {selectedInterests.slice(0, 8).map((id) => {
                  const interest = INTERESTS.find((i) => i.id === id);
                  if (!interest) return null;
                  return <Tag key={id} interest={interest} selected size="sm" />;
                })}
                {selectedInterests.length > 8 && (
                  <span className="inline-flex items-center px-3 py-1.5 bg-slate-100 dark:bg-navy-800 rounded-2xl text-xs text-slate-500 dark:text-slate-400 font-medium">
                    +{selectedInterests.length - 8} more
                  </span>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="w-full max-w-xs"
              >
                <Button onClick={handleFinish} size="lg" fullWidth>
                  Start Learning →
                </Button>
              </motion.div>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                onClick={() => go(1)}
                className="mt-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors min-h-[44px] px-3"
              >
                <ArrowLeft size={14} /> Edit interests
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
