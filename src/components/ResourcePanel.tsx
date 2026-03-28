import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, PlayCircle, FileText, ExternalLink } from 'lucide-react';
import { fetchRelatedArticles } from '../api/wikipedia';
import { fetchBookRecommendations } from '../api/openLibrary';
import type { RelatedArticle, BookResult } from '../types';

interface ResourcePanelProps {
  wikiTitle: string;
  articleTitle: string;
}

type Tab = 'related' | 'books' | 'explore';

const EXPLORE_LINKS = (q: string) => [
  {
    label: 'YouTube',
    icon: PlayCircle,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
    desc: 'Watch videos',
  },
  {
    label: 'TED Talks',
    icon: FileText,
    url: `https://www.ted.com/search?q=${encodeURIComponent(q)}`,
    desc: 'Watch talks',
  },
  {
    label: 'Web articles',
    icon: ExternalLink,
    url: `https://duckduckgo.com/?q=${encodeURIComponent(q + ' explained')}`,
    desc: 'Read articles',
  },
  {
    label: 'Podcast',
    icon: FileText,
    url: `https://open.spotify.com/search/${encodeURIComponent(q)}/podcasts`,
    desc: 'Listen to episodes',
  },
];

export function ResourcePanel({ wikiTitle, articleTitle }: ResourcePanelProps) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('related');
  const [related, setRelated] = useState<RelatedArticle[]>([]);
  const [books, setBooks] = useState<BookResult[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);

  useEffect(() => {
    setLoadingRelated(true);
    fetchRelatedArticles(wikiTitle).then((r) => { setRelated(r); setLoadingRelated(false); });
  }, [wikiTitle]);

  useEffect(() => {
    if (tab === 'books' && books.length === 0) {
      setLoadingBooks(true);
      fetchBookRecommendations(articleTitle).then((b) => { setBooks(b); setLoadingBooks(false); });
    }
  }, [tab, articleTitle, books.length]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'related',  label: 'Related' },
    { id: 'books',    label: 'Books' },
    { id: 'explore',  label: 'Explore' },
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
        {/* ── Related articles ── */}
        {tab === 'related' && (
          <motion.div
            key="related"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            {loadingRelated ? (
              <div className="flex gap-3 px-5 overflow-x-auto pb-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="shrink-0 w-44 h-32 rounded-2xl bg-slate-100 dark:bg-navy-800 animate-pulse" />
                ))}
              </div>
            ) : related.length === 0 ? (
              <p className="px-5 text-sm text-slate-400">No related articles found.</p>
            ) : (
              <div className="flex gap-3 px-5 overflow-x-auto pb-1">
                {related.map((r) => (
                  <button
                    key={r.wikiTitle}
                    onClick={() => navigate(`/article/${encodeURIComponent(r.wikiTitle)}`)}
                    className="shrink-0 w-44 rounded-2xl border border-slate-100 dark:border-navy-700 bg-white dark:bg-navy-800 overflow-hidden text-left hover:border-slate-300 dark:hover:border-navy-600 transition-colors"
                  >
                    {r.thumbnailUrl && (
                      <img src={r.thumbnailUrl} alt={r.title} className="w-full h-24 object-cover" />
                    )}
                    <div className="p-3">
                      <p className="text-xs font-bold text-navy-900 dark:text-white line-clamp-2 leading-snug">
                        {r.title}
                      </p>
                      {r.extract && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{r.extract}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Books ── */}
        {tab === 'books' && (
          <motion.div
            key="books"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
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
                {books.map((b) => (
                  <a
                    key={b.openLibraryUrl}
                    href={b.openLibraryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-navy-700 bg-white dark:bg-navy-800 hover:border-slate-300 dark:hover:border-navy-600 transition-colors"
                  >
                    {b.coverId ? (
                      <img
                        src={`https://covers.openlibrary.org/b/id/${b.coverId}-S.jpg`}
                        alt={b.title}
                        className="w-10 h-14 object-cover rounded-lg shrink-0"
                      />
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
                    <ExternalLink size={13} className="text-slate-300 shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Explore ── */}
        {tab === 'explore' && (
          <motion.div
            key="explore"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
            className="px-5 grid grid-cols-2 gap-2"
          >
            {EXPLORE_LINKS(articleTitle).map(({ label, icon: Icon, url, desc }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-2 p-4 rounded-2xl border border-slate-100 dark:border-navy-700 bg-white dark:bg-navy-800 hover:border-slate-300 dark:hover:border-navy-600 transition-colors"
              >
                <Icon size={18} className="text-slate-500 dark:text-slate-400" strokeWidth={1.8} />
                <div>
                  <p className="text-sm font-bold text-navy-900 dark:text-white">{label}</p>
                  <p className="text-[11px] text-slate-400">{desc}</p>
                </div>
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
