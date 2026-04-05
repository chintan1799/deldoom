import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { fetchTermSummary } from '../api/wikipedia';
import type { WikiSummaryResponse } from '../types';

interface WikiTermPopupProps {
  wikiTitle: string | null;
  onClose: () => void;
}

export function WikiTermPopup({ wikiTitle, onClose }: WikiTermPopupProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<WikiSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wikiTitle) { setData(null); return; }
    setLoading(true);
    fetchTermSummary(wikiTitle).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [wikiTitle]);

  function handleReadFull() {
    if (!wikiTitle) return;
    onClose();
    navigate(`/article/${encodeURIComponent(wikiTitle)}`);
  }

  return (
    <AnimatePresence>
      {wikiTitle && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-navy-900 rounded-t-3xl shadow-2xl max-h-[70vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-navy-700" />
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400"
            >
              <X size={15} strokeWidth={2.5} />
            </button>

            <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2">
              {loading ? (
                <div className="space-y-3 py-4 animate-pulse">
                  <div className="h-5 bg-slate-100 dark:bg-navy-800 rounded-xl w-3/4" />
                  <div className="h-4 bg-slate-100 dark:bg-navy-800 rounded-xl w-full" />
                  <div className="h-4 bg-slate-100 dark:bg-navy-800 rounded-xl w-5/6" />
                </div>
              ) : data ? (
                <>
                  {/* Thumbnail */}
                  {data.thumbnail?.source && (
                    <img
                      src={data.thumbnail.source}
                      alt={data.title}
                      className="w-full h-36 object-cover rounded-2xl mb-4"
                    />
                  )}

                  {/* Title + description */}
                  <h3 className="text-lg font-black text-navy-900 dark:text-white mb-0.5">
                    {data.title}
                  </h3>
                  {data.description && (
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                      {data.description}
                    </p>
                  )}

                  {/* Short extract */}
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                    {data.extract?.slice(0, 280)}{data.extract?.length > 280 ? '…' : ''}
                  </p>

                  <button
                    onClick={handleReadFull}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-navy-900 dark:bg-white text-white dark:text-navy-900 font-bold text-sm"
                  >
                    Read full article <ArrowRight size={15} strokeWidth={2.5} />
                  </button>
                </>
              ) : (
                <p className="text-sm text-slate-400 py-4 text-center">Couldn't load this term.</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
