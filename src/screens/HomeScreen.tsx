import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Dices } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useArticle } from '../hooks/useArticle';
import { ArticleCard } from '../components/ArticleCard';
import { DrawerMenu } from '../components/DrawerMenu';
import { MilestoneModal } from '../components/MilestoneModal';

function SkeletonFull() {
  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-navy-950 animate-pulse flex flex-col">
      <div className="w-full h-[45vh] bg-slate-200 dark:bg-navy-800" />
      <div className="flex-1 bg-white dark:bg-navy-950 rounded-t-[28px] px-5 pt-5 space-y-4">
        <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded-full w-24" />
        <div className="h-7 bg-slate-200 dark:bg-navy-800 rounded-xl w-full" />
        <div className="h-7 bg-slate-200 dark:bg-navy-800 rounded-xl w-2/3" />
        <div className="space-y-2 pt-2">
          <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}

export function HomeScreen() {
  const { selectedInterests, saveArticle, addToHistory, updateStreak, rollCount, incrementRollCount, isMilestone } = useAppStore();
  const { article, loading, error, roll } = useArticle(selectedInterests);
  const [milestoneCount, setMilestoneCount] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  function handleSave() {
    if (article) { saveArticle(article); addToHistory(article); }
    doRoll();
  }

  function handleSkip() {
    if (article) addToHistory(article);
    doRoll();
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
        {/* Right spacer matches left button width */}
        <div className="w-10" />
      </div>

      {/* Card / loading / error area */}
      <AnimatePresence mode="wait">
        {loading ? (
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
