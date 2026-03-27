import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { useArticle } from '../hooks/useArticle';
import { ArticleCard } from '../components/ArticleCard';
import { DiceButton } from '../components/DiceButton';
import { BottomNav } from '../components/BottomNav';

function SkeletonCard() {
  return (
    <div className="w-full max-w-sm mx-auto rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xl border border-zinc-100 dark:border-zinc-800 animate-pulse">
      <div className="w-full h-52 bg-zinc-200 dark:bg-zinc-800" />
      <div className="p-6 space-y-4">
        <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full w-28" />
        <div className="space-y-2">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full" />
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-3/4" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
        </div>
        <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
      </div>
    </div>
  );
}

export function HomeScreen() {
  const { selectedInterests, saveArticle, addToHistory, updateStreak, streak } = useAppStore();
  const { article, loading, error, roll } = useArticle(selectedInterests);

  useEffect(() => {
    roll();
    updateStreak();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSave() {
    if (article) {
      saveArticle(article);
      addToHistory(article);
      roll();
    }
  }

  function handleSkip() {
    if (article) addToHistory(article);
    roll();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col pb-24">
      {/* Header */}
      <div className="px-6 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              deldoom
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">
              {selectedInterests.length} topics · roll something new
            </p>
          </div>
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-900 px-3 py-1.5 rounded-2xl"
            >
              <span className="text-lg">🔥</span>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                {streak}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 gap-10">
        {/* Article card */}
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
                className="w-full max-w-sm mx-auto p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-center shadow-xl"
              >
                <div className="text-5xl mb-4">😅</div>
                <h3 className="font-bold text-zinc-800 dark:text-white mb-2">
                  Couldn't connect
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
                  Wikipedia seems to be taking a breather. Try rolling again.
                </p>
                <button
                  onClick={roll}
                  className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-semibold text-sm"
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

        {/* Dice button */}
        <DiceButton onRoll={roll} loading={loading} />
      </div>

      <BottomNav />
    </div>
  );
}
