import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Bookmark, Settings } from 'lucide-react';

const navItems = [
  { to: '/home',     label: 'Discover', Icon: Compass  },
  { to: '/saved',    label: 'Saved',    Icon: Bookmark },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white/95 dark:bg-navy-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-navy-800 pb-safe">
      {navItems.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `relative flex flex-col items-center gap-1 py-3 px-6 min-w-[72px] transition-all ${
              isActive ? 'text-navy-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              </motion.div>
              <span className={`text-[11px] font-medium ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                {label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute bottom-1 w-1 h-1 rounded-full bg-accent"
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
