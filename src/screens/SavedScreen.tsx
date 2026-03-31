import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookMarked, Menu } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { DrawerMenu } from '../components/DrawerMenu';

export function SavedScreen() {
  const navigate = useNavigate();
  const { savedArticles, unsaveArticle } = useAppStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex flex-col pb-8">
      <div className="px-5 pb-6" style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-10 h-10 rounded-full bg-white dark:bg-navy-800 shadow flex items-center justify-center shrink-0"
          >
            <Menu size={20} strokeWidth={2} className="text-navy-900 dark:text-white" />
          </button>
          <h1 className="text-2xl font-black text-navy-900 dark:text-white">Saved</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {savedArticles.length === 0
            ? 'Nothing saved yet — swipe right on a card!'
            : `${savedArticles.length} article${savedArticles.length === 1 ? '' : 's'} saved`}
        </p>
      </div>

      <div className="flex-1 px-4">
        {savedArticles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-16 gap-4 text-center"
          >
            <BookMarked size={56} className="text-slate-200 dark:text-navy-800" strokeWidth={1.2} />
            <p className="text-slate-400 dark:text-slate-600 text-base max-w-xs">
              Swipe right on a card to keep articles here
            </p>
            <button
              onClick={() => navigate('/home')}
              className="mt-2 px-6 py-3 bg-navy-900 dark:bg-white text-white dark:text-navy-900 rounded-2xl font-bold text-sm"
            >
              Start rolling →
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {savedArticles.map((article) => (
                <motion.div
                  key={article.wikiTitle}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -50 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-100 dark:border-navy-800 overflow-hidden"
                >
                  <button
                    onClick={() => navigate(`/article/${encodeURIComponent(article.wikiTitle)}`)}
                    className="w-full text-left p-4 flex gap-4"
                  >
                    {article.thumbnailUrl && (
                      <img
                        src={article.thumbnailUrl}
                        alt={article.title}
                        className="w-16 h-16 rounded-xl object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-navy-800 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        {article.interestEmoji} {article.interestLabel}
                      </span>
                      <h3 className="font-bold text-navy-900 dark:text-white text-sm leading-snug line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-500 text-xs mt-1 line-clamp-2">
                        {article.extract}
                      </p>
                    </div>
                  </button>
                  <div className="px-4 pb-3 flex items-center justify-end">
                    <button
                      onClick={() => unsaveArticle(article.wikiTitle)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium min-h-[36px] px-2"
                    >
                      Remove
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
