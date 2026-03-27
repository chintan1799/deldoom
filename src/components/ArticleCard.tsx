import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import type { Article } from '../types';
import { useAppStore } from '../store/useAppStore';

interface ArticleCardProps {
  article: Article;
  onSkip: () => void;
  onSave: () => void;
}

export function ArticleCard({ article, onSkip, onSave }: ArticleCardProps) {
  const navigate = useNavigate();
  const isSaved = useAppStore((s) => s.isArticleSaved(article.wikiTitle));
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const saveOpacity = useTransform(x, [0, 80, 150], [0, 0.7, 1]);
  const skipOpacity = useTransform(x, [-150, -80, 0], [1, 0.7, 0]);

  const controls = useAnimation();

  async function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    const threshold = 100;
    if (info.offset.x > threshold) {
      await controls.start({ x: 400, opacity: 0, transition: { duration: 0.3 } });
      onSave();
    } else if (info.offset.x < -threshold) {
      await controls.start({ x: -400, opacity: 0, transition: { duration: 0.3 } });
      onSkip();
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } });
    }
  }

  function handleReadMore() {
    navigate(`/article/${encodeURIComponent(article.wikiTitle)}`);
  }

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      animate={controls}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.3}
      onDragEnd={handleDragEnd}
      className="relative w-full max-w-sm mx-auto cursor-grab active:cursor-grabbing"
      initial={{ scale: 0.9, opacity: 0, y: 40 }}
      whileInView={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 25 }}
    >
      {/* Swipe indicators */}
      <motion.div
        style={{ opacity: saveOpacity }}
        className="absolute top-6 right-6 z-20 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg"
      >
        🔖 Save
      </motion.div>
      <motion.div
        style={{ opacity: skipOpacity }}
        className="absolute top-6 left-6 z-20 bg-zinc-800 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg"
      >
        ✕ Skip
      </motion.div>

      {/* Card */}
      <div className="rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-100 dark:border-zinc-800">
        {/* Hero image */}
        {article.thumbnailUrl && (
          <div className="w-full h-52 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            <img
              src={article.thumbnailUrl}
              alt={article.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Interest tag */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: article.interestColor }}
            >
              {article.interestEmoji} {article.interestLabel}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 leading-tight line-clamp-3">
            {article.title}
          </h2>

          {/* Extract */}
          <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed line-clamp-4 mb-6">
            {article.extract}
          </p>

          {/* CTA */}
          <button
            onClick={handleReadMore}
            className="w-full py-3.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm transition-opacity hover:opacity-90 active:opacity-80"
          >
            Dig deeper →
          </button>
        </div>
      </div>

      {/* Swipe hint */}
      <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-4 select-none">
        ← skip &nbsp;&nbsp;&nbsp; swipe &nbsp;&nbsp;&nbsp; save →
      </p>
    </motion.div>
  );
}
