import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useArticle } from '../hooks/useArticle';
import { ArticleCard } from '../components/ArticleCard';
import { DiceButton } from '../components/DiceButton';
import { BottomNav } from '../components/BottomNav';
import { MilestoneModal } from '../components/MilestoneModal';

function SkeletonCard() {
  return (
    <div className="w-full max-w-sm mx-auto rounded-3xl overflow-hidden bg-white dark:bg-navy-900 shadow-xl border border-slate-100 dark:border-navy-800 animate-pulse">
      <div className="w-full h-52 bg-slate-200 dark:bg-navy-800" />
      <div className="p-6 space-y-4">
        <div className="h-5 bg-slate-200 dark:bg-navy-800 rounded-full w-28" />
        <div className="space-y-2">
          <div className="h-7 bg-slate-200 dark:bg-navy-800 rounded-xl w-full" />
          <div className="h-7 bg-slate-200 dark:bg-navy-800 rounded-xl w-3/4" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-2/3" />
        </div>
        <div className="h-12 bg-slate-200 dark:bg-navy-800 rounded-2xl" />
      </div>
    </div>
  );
}

export function HomeScreen() {
  const { selectedInterests, saveArticle, addToHistory, updateStreak, streak, rollCount, incrementRollCount, isMilestone } = useAppStore();
  const { article, loading, error, roll } = useArticle(selectedInterests);
  const [milestoneCount, setMilestoneCount] = useState<number | null>(null);

  useEffect(() => {
    roll();
    updateStreak();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function doRoll() {
    const newCount = rollCount + 1;
    incrementRollCount();
    if (isMilestone(newCount)) {
      setMilestoneCount(newCount);
    }
    roll();
  }

  function handleSave() {
    if (article) {
      saveArticle(article);
      addToHistory(article);
    }
    doRoll();
  }

  function handleSkip() {
    if (article) addToHistory(article);
    doRoll();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex flex-col pb-24">
      {/* Header */}
      <div className="px-6 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">
              deldoom
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              {selectedInterests.length} topics · roll something new
            </p>
          </div>
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex items-center gap-1.5 bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 px-3 py-1.5 rounded-2xl"
            >
              <Flame size={15} className="text-slate-500 dark:text-slate-400" strokeWidth={2} />
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {streak}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 gap-10">
        <div className="w-full">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <SkeletonCard />
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-sm mx-auto p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-100 dark:border-navy-800 text-center shadow-xl"
              >
                <p className="text-4xl mb-4">😅</p>
                <h3 className="font-bold text-navy-900 dark:text-white mb-2">
                  Couldn't connect
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                  Wikipedia seems to be taking a breather. Try rolling again.
                </p>
                <button
                  onClick={doRoll}
                  className="px-6 py-3 bg-navy-900 dark:bg-white text-white dark:text-navy-900 rounded-2xl font-bold text-sm"
                >
                  Try again
                </button>
              </motion.div>
            ) : article ? (
              <motion.div key={article.wikiTitle}>
                <ArticleCard
                  article={article}
                  onSkip={handleSkip}
                  onSave={handleSave}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <DiceButton onRoll={doRoll} loading={loading} />
      </div>

      <BottomNav />

      {milestoneCount !== null && (
        <MilestoneModal
          rollCount={milestoneCount}
          onDismiss={() => setMilestoneCount(null)}
        />
      )}
    </div>
  );
}
