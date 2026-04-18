import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Dices, RotateCcw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useArticle } from '../hooks/useArticle';
import { ArticleCard } from '../components/ArticleCard';
import { DrawerMenu } from '../components/DrawerMenu';
import { MilestoneModal } from '../components/MilestoneModal';

function SkeletonFull() {
  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-navy-950 flex flex-col">
      <div className="w-full h-[45vh] shimmer" />
      <div className="flex-1 bg-white dark:bg-navy-950 rounded-t-[28px] px-5 pt-5 space-y-4">
        <div className="h-4 shimmer rounded-full w-24" />
        <div className="h-7 shimmer rounded-xl w-full" />
        <div className="h-7 shimmer rounded-xl w-2/3" />
        <div className="space-y-2 pt-2">
          <div className="h-4 shimmer rounded w-full" />
          <div className="h-4 shimmer rounded w-full" />
          <div className="h-4 shimmer rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}

/** Delay the skeleton by ~300ms so fast (prefetched / cached) loads don't flash a loading state. */
function useDelayedFlag(active: boolean, delayMs = 300) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!active) { setShow(false); return; }
    const t = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(t);
  }, [active, delayMs]);
  return show;
}

export function HomeScreen() {
  const { selectedInterests, saveArticle, addToHistory, updateStreak, rollCount, incrementRollCount, isMilestone, logBehaviour } = useAppStore();
  const { article, loading, error, roll, goBack, canGoBack } = useArticle(selectedInterests);
  const [milestoneCount, setMilestoneCount] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Skeleton only renders if loading persists >300ms — avoids flash on queue hits
  const showSkeleton = useDelayedFlag(loading && !article);

  useEffect(() => {
    roll();
    updateStreak();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function doRoll() {
    const newCount = rollCount + 1;
    incrementRollCount();
    if (isMilestone(newCount)) setMilestoneCount(newCount);
    roll();
  }

  function handleSave(dwellMs: number) {
    if (article) {
      saveArticle(article);
      addToHistory(article);
      logBehaviour({ articleId: article.id, title: article.title, interest: article.interestLabel, source: article.source ?? 'wikipedia', action: 'saved', dwellMs, timestamp: Date.now() });
    }
    doRoll();
  }

  function handleSkip(dwellMs: number) {
    if (article) {
      addToHistory(article);
      logBehaviour({ articleId: article.id, title: article.title, interest: article.interestLabel, source: article.source ?? 'wikipedia', action: 'skipped', dwellMs, timestamp: Date.now() });
    }
    doRoll();
  }

  function handleDigDeeper(dwellMs: number) {
    if (article) {
      logBehaviour({ articleId: article.id, title: article.title, interest: article.interestLabel, source: article.source ?? 'wikipedia', action: 'dug_deeper', dwellMs, timestamp: Date.now() });
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-navy-950">
      {/* Floating header */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5"
        style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-10 h-10 rounded-full bg-white/80 dark:bg-navy-800/80 backdrop-blur-sm shadow flex items-center justify-center"
        >
          <Menu size={20} strokeWidth={2} className="text-navy-900 dark:text-white" />
        </button>
        <div className="flex items-center gap-1.5 bg-white/80 dark:bg-navy-800/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow">
          <Dices size={13} className="text-navy-900 dark:text-white" strokeWidth={2} />
          <span className="text-xs font-black text-navy-900 dark:text-white tracking-tight">deldoom</span>
        </div>
        {/* Roll-back button — visible only when a previous card exists */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={goBack}
          className={`w-10 h-10 rounded-full bg-white/80 dark:bg-navy-800/80 backdrop-blur-sm shadow flex items-center justify-center transition-opacity duration-200 ${canGoBack ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <RotateCcw size={18} strokeWidth={2} className="text-navy-900 dark:text-white" />
        </motion.button>
      </div>

      {/* Card / loading / error area */}
      <AnimatePresence mode="wait">
        {showSkeleton ? (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SkeletonFull />
          </motion.div>
        ) : error ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 flex flex-col items-center justify-center px-8 text-center bg-slate-50 dark:bg-navy-950">
            <p className="text-5xl mb-4">😅</p>
            <h3 className="font-bold text-navy-900 dark:text-white mb-2 text-lg">Couldn't connect</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Wikipedia seems to be resting. Try again.</p>
            <button onClick={doRoll}
              className="px-6 py-3 bg-navy-900 dark:bg-white text-white dark:text-navy-900 rounded-2xl font-bold text-sm">
              Try again
            </button>
          </motion.div>
        ) : article ? (
          <motion.div key={article.wikiTitle + article.source} className="fixed inset-0">
            <ArticleCard
              article={article}
              onSkip={handleSkip}
              onSave={handleSave}
              onRoll={doRoll}
              onDigDeeper={handleDigDeeper}
              loading={loading}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {milestoneCount !== null && (
        <MilestoneModal rollCount={milestoneCount} onDismiss={() => setMilestoneCount(null)} />
      )}
    </div>
  );
}
