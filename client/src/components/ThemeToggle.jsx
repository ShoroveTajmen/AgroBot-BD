import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`w-9 h-9 rounded-full flex items-center justify-center transition
        bg-[#e8f5e9] hover:bg-[#c8e6c9]
        dark:bg-gray-700 dark:hover:bg-gray-600 ${className}`}
    >
      {isDark ? (
        /* Sun — shown in dark mode to switch to light */
        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>
          <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      ) : (
        /* Moon — shown in light mode to switch to dark */
        <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
      )}
    </button>
  );
}
