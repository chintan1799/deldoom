import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Dices } from 'lucide-react';
import type { Article } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useScrollFeed } from '../hooks/useScrollFeed';
import { ScrollCard } from './ScrollCard';
import { ScrollFeedSkeleton } from './ScrollFeedSkeleton';
import { DrawerMenu } from './DrawerMenu';
import { MilestoneModal } from './MilestoneModal';

export function ScrollFeed() {
  const {
    selectedInterests,
    saveArticle,
    addToHistory,
    rollCount,
    incrementRollCount,
    isMilestone,
  } = useAppStore();

  const { articles, loadingInitial, loadingMore, loadMore, refresh } =
    useScrollFeed(selectedInterests);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [milestoneCount, setMilestoneCount] = useState<number | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingMoreRef = useRef(false);
  const pullStartY = useRef(0);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loadingInitial) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingMoreRef.current) {
          isFetchingMoreRef.current = true;
          loadMore();
          setTimeout(() => {
            isFetchingMoreRef.current = false;
          }, 2000);
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadingInitial, loadMore]);

  // Pull-to-refresh touch handlers
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      if (el!.scrollTop === 0) {
        pullStartY.current = e.touches[0].clientY;
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (el!.scrollTop === 0 && pullStartY.current > 0) {
        const delta = e.touches[0].clientY - pullStartY.current;
        if (delta > 50) setIsPulling(true);
      }
    }

    async function onTouchEnd() {
      if (isPulling) {
        setIsPulling(false);
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
      }
      pullStartY.current = 0;
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [isPulling, refresh]);

  function handleSave(article: Article) {
    saveArticle(article);
    addToHistory(article);
    const newCount = rollCount + 1;
    incrementRollCount();
    if (isMilestone(newCount)) setMilestoneCount(newCount);
  }

  function handleSkip(article: Article) {
    addToHistory(article);
  }

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-navy-950 flex flex-col">
      {/* Fixed header */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5"
        style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-10 h-10 rounded-full bg-white/80 dark:bg-navy-800/80 backdrop-blur-sm shadow flex items-center justify-center"
        >
          <Menu size={20} strokeWidth={2} className="text-navy-900 dark:text-white" />
        </button>
        <div className="flex items-center gap-1.5 bg-white/80 dark:bg-navy-800/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow">
          <Dices size={13} className="text-navy-900 dark:text-white" strokeWidth={2} />
          <span className="text-xs font-black text-navy-900 dark:text-white tracking-tight">Lore</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Scrollable feed */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop: '72px',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          overscrollBehavior: 'contain',
        }}
      >
        {/* Pull-to-refresh indicator */}
        <AnimatePresence>
          {(isPulling || refreshing) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-3"
            >
              {refreshing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                >
                  <Dices size={20} className="text-slate-400" strokeWidth={1.5} />
                </motion.div>
              ) : (
                <p className="text-sm text-slate-400">Release to refresh</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Initial skeleton */}
        {loadingInitial && (
          <div className="px-4 pt-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <ScrollFeedSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Articles */}
        {!loadingInitial && (
          <div className="px-4 pt-2">
            {articles.map((article, i) => (
              <ScrollCard
                key={article.pageUrl}
                article={article}
                index={i}
                onSave={handleSave}
                onSkip={handleSkip}
              />
            ))}

            {/* Load-more skeletons */}
            {loadingMore && (
              <div>
                {[0, 1, 2].map((i) => (
                  <ScrollFeedSkeleton key={`more-${i}`} />
                ))}
              </div>
            )}

            {/* Sentinel — triggers load-more */}
            <div ref={sentinelRef} className="h-1" />
          </div>
        )}
      </div>

      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {milestoneCount !== null && (
        <MilestoneModal rollCount={milestoneCount} onDismiss={() => setMilestoneCount(null)} />
      )}
    </div>
  );
}
