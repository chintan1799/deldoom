import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { X, Share2, Download, Check, ChevronLeft, ChevronRight } from 'lucide-react';

function XLogo({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 1200 1227" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M714 519 1160 0H1054L667 450 358 0H0l468 681L0 1227h106l409-475 327 475h358L714 519Zm-145 168-47-68L144 80h162l304 437 47 68 396 566H891L569 687Z" />
    </svg>
  );
}
import { CuriosityReportCard } from './CuriosityReportCard';
import { useCuriosityReport } from '../hooks/useCuriosityReport';

interface Props {
  open: boolean;
  onClose: () => void;
}

const THEMES = ['light', 'dark'] as const;
type Theme = typeof THEMES[number];

export function ShareCuriosityModal({ open, onClose }: Props) {
  const data = useCuriosityReport();
  const [themeIdx, setThemeIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const theme: Theme = THEMES[themeIdx];

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  }

  async function captureCard(): Promise<Blob | null> {
    if (!cardRef.current) return null;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      logging: false,
    });
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  }

  async function handleDownload() {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await captureCard();
      if (!blob) throw new Error('capture failed');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deldoom-curiosity-report-${theme}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Saved');
    } catch {
      showToast('Failed to save');
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await captureCard();
      if (!blob) throw new Error('capture failed');
      const file = new File([blob], 'curiosity-report.png', { type: 'image/png' });

      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
        share?: (data: ShareData) => Promise<void>;
      };

      if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: 'My Curiosity Report',
          text: `My 7-day curiosity report — ${data.stats.ideasAbsorbed} ideas absorbed`,
        });
      } else {
        // Fallback to download on desktop / unsupported browsers
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `deldoom-curiosity-report-${theme}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast('Saved (share not supported)');
      }
    } catch {
      // User canceled share — do nothing
    } finally {
      setBusy(false);
    }
  }

  async function handleTwitter() {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await captureCard();
      if (!blob) throw new Error('capture failed');

      // Try to put the image on the clipboard so the user can paste it
      try {
        const clip = navigator.clipboard as Clipboard & {
          write?: (items: ClipboardItem[]) => Promise<void>;
        };
        if (clip?.write && typeof ClipboardItem !== 'undefined') {
          await clip.write([new ClipboardItem({ 'image/png': blob })]);
          showToast('Image copied — paste into tweet');
        }
      } catch {
        // clipboard unavailable; silently fall back to just opening the intent
      }

      const text = `My 7-day curiosity report — ${data.stats.ideasAbsorbed} ideas absorbed, ${data.stats.streak}-day streak. Built with deldoom 🧠`;
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setBusy(false);
    }
  }

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -60 && themeIdx < THEMES.length - 1) setThemeIdx((i) => i + 1);
    else if (info.offset.x > 60 && themeIdx > 0) setThemeIdx((i) => i - 1);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col items-center max-w-md w-full my-auto"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 z-10 w-10 h-10 rounded-full bg-white dark:bg-navy-800 shadow-lg flex items-center justify-center"
            >
              <X size={18} className="text-navy-900 dark:text-white" strokeWidth={2.5} />
            </button>

            {/* Carousel arrows (desktop hint) */}
            {themeIdx > 0 && (
              <button
                onClick={() => setThemeIdx((i) => Math.max(0, i - 1))}
                className="hidden sm:flex absolute left-[-48px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-navy-800 shadow-lg items-center justify-center z-10"
              >
                <ChevronLeft size={20} className="text-navy-900 dark:text-white" />
              </button>
            )}
            {themeIdx < THEMES.length - 1 && (
              <button
                onClick={() => setThemeIdx((i) => Math.min(THEMES.length - 1, i + 1))}
                className="hidden sm:flex absolute right-[-48px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-navy-800 shadow-lg items-center justify-center z-10"
              >
                <ChevronRight size={20} className="text-navy-900 dark:text-white" />
              </button>
            )}

            {/* Swipeable card */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="touch-none cursor-grab active:cursor-grabbing"
              style={{ borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            >
              <div ref={cardRef}>
                <CuriosityReportCard theme={theme} data={data} />
              </div>
            </motion.div>

            {/* Theme dots */}
            <div className="flex items-center justify-center gap-2 mt-4 mb-2">
              {THEMES.map((t, i) => (
                <button
                  key={t}
                  onClick={() => setThemeIdx(i)}
                  className={`transition-all rounded-full ${
                    i === themeIdx
                      ? 'w-6 h-2 bg-white'
                      : 'w-2 h-2 bg-white/40'
                  }`}
                  aria-label={`Show ${t} theme`}
                />
              ))}
            </div>
            <p className="text-xs text-white/60 mb-4 tracking-wide uppercase font-semibold">
              {theme} · swipe to switch
            </p>

            {/* Share actions */}
            <div className="grid grid-cols-3 gap-3 w-full">
              <button
                onClick={handleShare}
                disabled={busy}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white dark:bg-navy-800 disabled:opacity-50 transition"
              >
                <Share2 size={18} className="text-navy-900 dark:text-white" strokeWidth={2} />
                <span className="text-[11px] font-bold text-navy-900 dark:text-white uppercase tracking-wide">Share</span>
              </button>
              <button
                onClick={handleTwitter}
                disabled={busy}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-black disabled:opacity-50 transition text-white"
              >
                <XLogo size={16} />
                <span className="text-[11px] font-bold uppercase tracking-wide">Post</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={busy}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white dark:bg-navy-800 disabled:opacity-50 transition"
              >
                <Download size={18} className="text-navy-900 dark:text-white" strokeWidth={2} />
                <span className="text-[11px] font-bold text-navy-900 dark:text-white uppercase tracking-wide">Save</span>
              </button>
            </div>

            {/* Toast */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 12, opacity: 0 }}
                  className="mt-4 px-4 py-2 rounded-full bg-green-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg"
                >
                  <Check size={14} strokeWidth={3} />
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
