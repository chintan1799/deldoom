import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { INTERESTS, INTEREST_GROUPS } from '../data/interests';
import { Tag } from '../components/ui/Tag';
import { Button } from '../components/ui/Button';
import { BottomNav } from '../components/BottomNav';
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

  const filteredInterests = activeGroup
    ? INTERESTS.filter((i) => i.group === activeGroup)
    : INTERESTS;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col pb-24">
      {/* Header */}
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white">⚙️ Settings</h1>

        {/* Stats row */}
        <div className="flex gap-3 mt-4">
          {[
            { label: 'Topics', value: selectedInterests.length, emoji: '🎯' },
            { label: 'Streak', value: streak, emoji: '🔥' },
            { label: 'Read', value: history.length, emoji: '📖' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-3 text-center"
            >
              <div className="text-xl mb-1">{stat.emoji}</div>
              <div className="text-lg font-black text-zinc-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="px-6 mb-4">
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl">
          {(['interests', 'history'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${
                tab === t
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-500'
              }`}
            >
              {t === 'interests' ? '🎯 My Interests' : '📖 History'}
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
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      !activeGroup
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                        : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    All
                  </button>
                  {INTEREST_GROUPS.map((group) => (
                    <button
                      key={group}
                      onClick={() => setActiveGroup(activeGroup === group ? null : group)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                        activeGroup === group
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
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

              <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center pb-4">
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
                  <span className="text-5xl">🌱</span>
                  <p className="text-zinc-400 dark:text-zinc-600 text-sm">
                    Articles you've seen will appear here
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {history.length} articles read
                    </span>
                    <button
                      onClick={clearHistory}
                      className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 font-medium"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="space-y-2 pb-4">
                    {history.map((article) => (
                      <div
                        key={article.wikiTitle}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800"
                      >
                        {article.thumbnailUrl && (
                          <img
                            src={article.thumbnailUrl}
                            alt={article.title}
                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold text-white mb-0.5"
                            style={{ backgroundColor: article.interestColor }}
                          >
                            {article.interestEmoji}
                          </div>
                          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
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
      <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="w-full text-sm text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors py-2"
          >
            Reset & redo onboarding
          </button>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
                This will clear your interests. Continue?
              </p>
              <div className="flex gap-2">
                <Button onClick={() => setShowReset(false)} variant="secondary" fullWidth size="sm">
                  Cancel
                </Button>
                <Button
                  onClick={resetOnboarding}
                  variant="primary"
                  fullWidth
                  size="sm"
                >
                  Reset
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
