import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { BottomNav } from '../components/BottomNav';

export function SavedScreen() {
  const navigate = useNavigate();
  const { savedArticles, unsaveArticle } = useAppStore();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col pb-24">
      <div className="px-6 pt-14 pb-6">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white">🔖 Saved</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
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
            <span className="text-6xl">📚</span>
            <p className="text-zinc-400 dark:text-zinc-600 text-base">
              Swipe right on a card or tap "🔖 Save" to keep articles here
            </p>
            <button
              onClick={() => navigate('/home')}
              className="mt-2 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-semibold text-sm"
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
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden"
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
                      <div
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white mb-1"
                        style={{ backgroundColor: article.interestColor }}
                      >
                        {article.interestEmoji} {article.interestLabel}
                      </div>
                      <h3 className="font-bold text-zinc-900 dark:text-white text-sm leading-snug line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-zinc-500 dark:text-zinc-500 text-xs mt-1 line-clamp-2">
                        {article.extract}
                      </p>
                    </div>
                  </button>
                  <div className="px-4 pb-3 flex items-center justify-end">
                    <button
                      onClick={() => unsaveArticle(article.wikiTitle)}
                      className="text-xs text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors font-medium"
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

      <BottomNav />
    </div>
  );
}
