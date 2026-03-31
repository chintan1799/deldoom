import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ShoppingCart } from 'lucide-react';
import { fetchRelatedArticles } from '../api/wikipedia';
import { fetchBookRecommendations } from '../api/openLibrary';
import type { RelatedArticle, BookResult } from '../types';

interface ResourcePanelProps {
  wikiTitle: string;
  articleTitle: string;
}

type Tab = 'related' | 'books';

export function ResourcePanel({ wikiTitle, articleTitle }: ResourcePanelProps) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('related');
  const [related, setRelated] = useState<RelatedArticle[]>([]);
  const [books, setBooks] = useState<BookResult[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);

  useEffect(() => {
    setLoadingRelated(true);
    fetchRelatedArticles(wikiTitle)
      .then((r) => setRelated(r))
      .finally(() => setLoadingRelated(false));
  }, [wikiTitle]);

  useEffect(() => {
    if (tab === 'books' && books.length === 0) {
      setLoadingBooks(true);
      fetchBookRecommendations(articleTitle)
        .then((b) => setBooks(b))
        .finally(() => setLoadingBooks(false));
    }
  }, [tab, articleTitle, books.length]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'related', label: 'Related' },
    { id: 'books',   label: 'Books'   },
  ];

  return (
    <div className="mt-8 mb-4">
      <h3 className="text-base font-black text-navy-900 dark:text-white px-5 mb-3">
        Keep exploring
      </h3>

      {/* Tab bar */}
      <div className="flex gap-1 mx-5 mb-4 bg-slate-100 dark:bg-navy-800 p-1 rounded-2xl">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.id
                ? 'bg-white dark:bg-navy-700 text-navy-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Related articles (in-app navigation) ── */}
        {tab === 'related' && (
          <motion.div key="related"
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}
          >
            {loadingRelated ? (
              <div className="space-y-3 px-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-navy-800 animate-pulse" />
                ))}
              </div>
            ) : related.length === 0 ? (
              <p className="px-5 text-sm text-slate-400">No related articles found.</p>
            ) : (
              <div className="space-y-3 px-5">
                {related.map((r) => (
                  <button
                    key={r.wikiTitle}
                    onClick={() => navigate(`/article/${encodeURIComponent(r.wikiTitle)}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-navy-700 bg-white dark:bg-navy-800 text-left hover:border-slate-300 dark:hover:border-navy-600 transition-colors"
                  >
                    {r.thumbnailUrl ? (
                      <img src={r.thumbnailUrl} alt={r.title}
                        className="w-14 h-14 object-cover rounded-xl shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-navy-700 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-navy-900 dark:text-white line-clamp-2 leading-snug">
                        {r.title}
                      </p>
                      {r.extract && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{r.extract}</p>
                      )}
                    </div>
                    <span className="text-xs text-accent font-semibold shrink-0">Read →</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Books (Amazon buy link) ── */}
        {tab === 'books' && (
          <motion.div key="books"
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}
          >
            {loadingBooks ? (
              <div className="space-y-2 px-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-navy-800 animate-pulse" />
                ))}
              </div>
            ) : books.length === 0 ? (
              <p className="px-5 text-sm text-slate-400">No books found.</p>
            ) : (
              <div className="space-y-2 px-5">
                {books.map((b) => {
                  const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(b.title + ' ' + b.author)}`;
                  return (
                    <a key={b.openLibraryUrl} href={amazonUrl}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-navy-700 bg-white dark:bg-navy-800 hover:border-slate-300 dark:hover:border-navy-600 transition-colors"
                    >
                      {b.coverId ? (
                        <img src={`https://covers.openlibrary.org/b/id/${b.coverId}-S.jpg`}
                          alt={b.title} className="w-10 h-14 object-cover rounded-lg shrink-0" />
                      ) : (
                        <div className="w-10 h-14 rounded-lg bg-slate-100 dark:bg-navy-700 flex items-center justify-center shrink-0">
                          <BookOpen size={16} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-navy-900 dark:text-white line-clamp-2 leading-snug">
                          {b.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{b.author}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 text-xs font-semibold text-accent">
                        <ShoppingCart size={12} strokeWidth={2} /> Buy
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
