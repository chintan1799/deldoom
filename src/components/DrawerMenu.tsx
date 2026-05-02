import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Compass, Bookmark, Settings, Moon, Sun, Flame, Dices } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface DrawerMenuProps {
  open: boolean;
  onClose: () => void;
}

export function DrawerMenu({ open, onClose }: DrawerMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode, streak, rollCount } = useAppStore();

  // Close on route change
  useEffect(() => { onClose(); }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trap body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function go(path: string) {
    navigate(path);
    onClose();
  }

  const navItems = [
    { path: '/home',     Icon: Compass,  label: 'Discover' },
    { path: '/saved',    Icon: Bookmark, label: 'Saved'    },
    { path: '/settings', Icon: Settings, label: 'Settings' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[60] bg-navy-950/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed left-0 top-0 bottom-0 z-[70] w-72 flex flex-col bg-white dark:bg-navy-900 shadow-2xl"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-6 pb-5 border-b border-slate-100 dark:border-navy-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-navy-900 dark:bg-white flex items-center justify-center">
                  <Dices size={16} className="text-white dark:text-navy-900" strokeWidth={1.8} />
                </div>
                <span className="font-black text-lg text-navy-900 dark:text-white tracking-tight">Lore</span>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Streak card */}
            <div className="mx-4 mt-4 mb-1">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-navy-800 rounded-2xl px-4 py-3.5">
                <div className="w-10 h-10 rounded-xl bg-navy-900 dark:bg-white flex items-center justify-center shrink-0">
                  <Flame size={18} className="text-white dark:text-navy-900" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Current streak</p>
                  <p className="text-lg font-black text-navy-900 dark:text-white leading-tight">
                    {streak} {streak === 1 ? 'day' : 'days'}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Total rolls</p>
                  <p className="text-lg font-black text-navy-900 dark:text-white leading-tight">{rollCount}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-3 space-y-1">
              {navItems.map(({ path, Icon, label }) => {
                const active = location.pathname === path;
                return (
                  <button
                    key={path}
                    onClick={() => go(path)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-colors ${
                      active
                        ? 'bg-navy-900 dark:bg-white text-white dark:text-navy-900'
                        : 'text-navy-900 dark:text-white hover:bg-slate-50 dark:hover:bg-navy-800'
                    }`}
                  >
                    <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                    <span className="font-semibold text-sm">{label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Dark mode toggle */}
            <div className="px-4 pb-6 border-t border-slate-100 dark:border-navy-800 pt-4"
              style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-navy-800 transition-colors"
              >
                <div className="flex items-center gap-3 text-navy-900 dark:text-white">
                  {darkMode
                    ? <Sun size={18} strokeWidth={1.8} />
                    : <Moon size={18} strokeWidth={1.8} />}
                  <span className="font-semibold text-sm">{darkMode ? 'Light mode' : 'Dark mode'}</span>
                </div>
                {/* Toggle pill */}
                <div className={`relative w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-navy-900 dark:bg-white' : 'bg-slate-200'}`}>
                  <motion.div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-navy-900 shadow"
                    animate={{ x: darkMode ? 22 : 4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  />
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
