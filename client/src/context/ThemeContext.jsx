/**
 * ThemeContext.jsx — Global Dark/Light Theme State
 *
 * Provides theme state and toggle function to the entire component tree
 * via React Context API.
 *
 * Behaviour:
 *  - Reads initial theme from localStorage on first load (persists across sessions)
 *  - Applies/removes the 'dark' class on <html> to activate Tailwind dark: variants
 *  - Saves the current theme to localStorage whenever it changes
 *
 * Usage:
 *   const { isDark, toggleTheme } = useTheme();
 */

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

/**
 * ThemeProvider — Wrap the app with this to enable theme support.
 *
 * @param {React.ReactNode} children - Child components that can access theme state
 */
export function ThemeProvider({ children }) {
  // Initialise from localStorage so the theme persists across page refreshes
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Apply the theme class to <html> and persist to localStorage on every change
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(p => !p) }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme — Custom hook to access theme state from any component.
 *
 * @returns {{ isDark: boolean, toggleTheme: function }}
 */
export function useTheme() {
  return useContext(ThemeContext);
}
