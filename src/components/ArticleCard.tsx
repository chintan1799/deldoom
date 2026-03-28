import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Lightbulb, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  onSkip: () => void;
  onSave: () => void;
}

export function ArticleCard({ article, onSkip, onSave }: ArticleCardProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const x       = useMotionValue(0);
  const rotate  = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -80, 0, 80, 200], [0, 1, 1, 1, 0]);
  const saveOpacity = useTransform(x, [0, 60, 130], [0, 0.8, 1]);
  const skipOpacity = useTransform(x, [-130, -60, 0], [1, 0.8, 0]);

  const controls = useAnimation();

  async function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x > 110) {
      await controls.start({ x: 420, opacity: 0, transition: { duration: 0.28 } });
      onSave();
    } else if (info.offset.x < -110) {
      await controls.start({ x: -420, opacity: 0, transition: { duration: 0.28 } });
      onSkip();
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } });
    }
  }

  const imageUrl = article.thumbnailUrl || article.imageUrl;
  const shortExtract = article.extract.slice(0, 220) + (article.extract.length > 220 ? '…' : '');

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      animate={controls}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.25}
      onDragEnd={handleDragEnd}
      className="relative w-full max-w-sm mx-auto draggable-card"
      initial={{ scale: 0.93, y: 30 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
    >
      {/* Swipe labels */}
      <motion.div
        style={{ opacity: saveOpacity }}
        className="absolute top-5 right-5 z-20 bg-navy-900 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg pointer-events-none"
      >
        Save
      </motion.div>
      <motion.div
        style={{ opacity: skipOpacity }}
        className="absolute top-5 left-5 z-20 bg-slate-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg pointer-events-none"
      >
        Skip
      </motion.div>

      {/* Card */}
      <div className="rounded-3xl overflow-hidden bg-white dark:bg-navy-900 shadow-xl border border-slate-100 dark:border-navy-800">

        {/* Hero image */}
        {imageUrl && (
          <div className="w-full h-52 overflow-hidden bg-slate-100 dark:bg-navy-800">
            <img
              src={imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-5">
          {/* Category + meta row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
              {article.interestEmoji} {article.interestLabel}
            </span>
            {article.readingTimeMin && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-600">
                <Clock size={11} strokeWidth={2} />
                {article.readingTimeMin} min read
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-black text-navy-900 dark:text-white leading-tight mb-1">
            {article.title}
          </h2>

          {/* Description / subtitle */}
          {article.description && (
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">
              {article.description}
            </p>
          )}

          {/* Extract */}
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-1">
            {expanded ? article.extract : shortExtract}
          </p>

          {article.extract.length > 220 && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              className="flex items-center gap-1 text-xs text-accent font-medium mb-4 mt-1"
            >
              {expanded ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Read more</>}
            </button>
          )}

          {/* Interesting fact box */}
          {article.interestingFact && (
            <div className="bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-3.5 mb-5 flex gap-2.5">
              <Lightbulb size={15} className="text-accent shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <span className="font-bold text-navy-900 dark:text-white">Did you know? </span>
                {article.interestingFact}
              </p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => navigate(`/article/${encodeURIComponent(article.wikiTitle)}`)}
            className="w-full py-3.5 rounded-2xl bg-navy-900 dark:bg-white text-white dark:text-navy-900 font-bold text-sm tracking-wide hover:opacity-90 active:opacity-80 transition-opacity"
          >
            Dig deeper →
          </button>
        </div>
      </div>

      {/* Swipe hint */}
      <p className="text-center text-[11px] text-slate-300 dark:text-slate-700 mt-3 select-none tracking-wide">
        ← skip &nbsp;·&nbsp; swipe &nbsp;·&nbsp; save →
      </p>
    </motion.div>
  );
}
