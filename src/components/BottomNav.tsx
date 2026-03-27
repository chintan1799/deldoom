import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/home', label: 'Discover', icon: '🎲' },
  { to: '/saved', label: 'Saved', icon: '🔖' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 pb-safe">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-3 px-6 transition-all ${
              isActive
                ? 'text-zinc-900 dark:text-white'
                : 'text-zinc-400 dark:text-zinc-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <motion.span
                animate={{ scale: isActive ? 1.2 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="text-xl leading-none"
                role="img"
                aria-label={item.label}
              >
                {item.icon}
              </motion.span>
              <span className={`text-xs font-medium ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-0 h-0.5 w-6 bg-zinc-900 dark:bg-white rounded-full"
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
