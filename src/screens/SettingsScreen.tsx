import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Flame, BookOpen, RotateCcw, Menu } from 'lucide-react';
import { INTERESTS, INTEREST_GROUPS } from '../data/interests';
import { Tag } from '../components/ui/Tag';
import { Button } from '../components/ui/Button';
import { DrawerMenu } from '../components/DrawerMenu';
import { useAppStore } from '../store/useAppStore';

type Tab = 'interests' | 'history';

export function SettingsScreen() {
  const {
    selectedInterests,
    toggleInterest,
    history,
    clearHistory,
    streak,
    resetOnboarding,
  } = useAppStore();

  const [tab, setTab] = useState<Tab>('interests');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredInterests = activeGroup
    ? INTERESTS.filter((i) => i.group === activeGroup)
    : INTERESTS;

  const stats = [
    { label: 'Topics', value: selectedInterests.length, Icon: Target },
    { label: 'Streak', value: streak, Icon: Flame },
    { label: 'Read', value: history.length, Icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex flex-col pb-8">
      {/* Header */}
      <div className="px-5 pb-4" style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-10 h-10 rounded-full bg-white dark:bg-navy-800 shadow flex items-center justify-center shrink-0"
          >
            <Menu size={20} strokeWidth={2} className="text-navy-900 dark:text-white" />
          </button>
          <h1 className="text-2xl font-black text-navy-900 dark:text-white">Settings</h1>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mt-4">
          {stats.map(({ label, value, Icon }) => (
            <div
              key={label}
              className="flex-1 bg-white dark:bg-navy-900 rounded-2xl border border-slate-100 dark:border-navy-800 p-3 text-center"
            >
              <Icon size={16} className="text-slate-400 mx-auto mb-1" strokeWidth={1.8} />
              <div className="text-lg font-black text-navy-900 dark:text-white">{value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="px-6 mb-4">
        <div className="flex gap-1 bg-slate-100 dark:bg-navy-900 p-1 rounded-2xl">
          {(['interests', 'history'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${
                tab === t
                  ? 'bg-white dark:bg-navy-800 text-navy-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-500'
              }`}
            >
              {t === 'interests' ? 'My Interests' : 'History'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <AnimatePresence mode="wait">
          {tab === 'interests' && (
            <motion.div
              key="interests"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Group filter */}
              <div className="overflow-x-auto mb-4">
                <div className="flex gap-2 w-max pb-1">
                  <button
                    onClick={() => setActiveGroup(null)}
                    className={`px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
                      !activeGroup
                        ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-900'
                        : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-navy-700'
                    }`}
                  >
                    All
                  </button>
                  {INTEREST_GROUPS.map((group) => (
                    <button
                      key={group}
                      onClick={() => setActiveGroup(activeGroup === group ? null : group)}
                      className={`px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
                        activeGroup === group
                          ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-900'
                          : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-navy-700'
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 pb-4">
                {filteredInterests.map((interest) => (
                  <Tag
                    key={interest.id}
                    interest={interest}
                    selected={selectedInterests.includes(interest.id)}
                    onClick={() => toggleInterest(interest.id)}
                    size="sm"
                  />
                ))}
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-600 text-center pb-4">
                {selectedInterests.length} of {INTERESTS.length} topics selected
              </p>
            </motion.div>
          )}

          {tab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center pt-12 gap-3 text-center">
                  <BookOpen size={40} className="text-slate-200 dark:text-navy-800" strokeWidth={1.5} />
                  <p className="text-slate-400 dark:text-slate-600 text-sm">
                    Articles you've seen will appear here
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {history.length} articles read
                    </span>
                    <button
                      onClick={clearHistory}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="space-y-2 pb-4">
                    {history.map((article) => (
                      <div
                        key={article.wikiTitle}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-navy-900 rounded-2xl border border-slate-100 dark:border-navy-800"
                      >
                        {article.thumbnailUrl && (
                          <img
                            src={article.thumbnailUrl}
                            alt={article.title}
                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 mb-0.5">
                            {article.interestEmoji}
                          </span>
                          <p className="text-sm font-semibold text-navy-900 dark:text-slate-200 truncate">
                            {article.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reset onboarding */}
      <div className="px-6 py-4 border-t border-slate-100 dark:border-navy-800">
        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors py-3 min-h-[44px]"
          >
            <RotateCcw size={14} />
            Reset & redo onboarding
          </button>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                This will clear your interests. Continue?
              </p>
              <div className="flex gap-2">
                <Button onClick={() => setShowReset(false)} variant="secondary" fullWidth size="sm">
                  Cancel
                </Button>
                <Button onClick={resetOnboarding} variant="primary" fullWidth size="sm">
                  Reset
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
