/**
 * ============================================================
 *  UNIT TESTS — ThemeContext & useTheme hook
 *
 *  Tests theme initialisation from localStorage, toggling,
 *  DOM class manipulation, and localStorage persistence.
 * ============================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../../../context/ThemeContext.jsx';

// ── Helper component that exposes theme state ─────────────────────────────────
function ThemeConsumer() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="mode">{isDark ? 'dark' : 'light'}</span>
      <button onClick={toggleTheme} data-testid="toggle">Toggle</button>
    </div>
  );
}

function renderWithTheme() {
  return render(
    <ThemeProvider>
      <ThemeConsumer />
    </ThemeProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Initialisation
// ─────────────────────────────────────────────────────────────────────────────
describe('ThemeContext › initialisation', () => {

  beforeEach(() => localStorage.clear());

  it('✅ defaults to light mode when localStorage has no theme', () => {
    renderWithTheme();
    expect(screen.getByTestId('mode').textContent).toBe('light');
  });

  it('✅ initialises to dark mode when localStorage has theme="dark"', () => {
    localStorage.setItem('theme', 'dark');
    renderWithTheme();
    expect(screen.getByTestId('mode').textContent).toBe('dark');
  });

  it('✅ initialises to light mode when localStorage has theme="light"', () => {
    localStorage.setItem('theme', 'light');
    renderWithTheme();
    expect(screen.getByTestId('mode').textContent).toBe('light');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Toggle behaviour
// ─────────────────────────────────────────────────────────────────────────────
describe('ThemeContext › toggleTheme', () => {

  beforeEach(() => localStorage.clear());

  it('✅ switches from light to dark on first toggle', async () => {
    renderWithTheme();
    await userEvent.click(screen.getByTestId('toggle'));
    expect(screen.getByTestId('mode').textContent).toBe('dark');
  });

  it('✅ switches from dark to light on second toggle', async () => {
    renderWithTheme();
    await userEvent.click(screen.getByTestId('toggle'));
    await userEvent.click(screen.getByTestId('toggle'));
    expect(screen.getByTestId('mode').textContent).toBe('light');
  });

  it('✅ persists "dark" to localStorage after toggling to dark', async () => {
    renderWithTheme();
    await userEvent.click(screen.getByTestId('toggle'));
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('✅ persists "light" to localStorage after toggling back to light', async () => {
    localStorage.setItem('theme', 'dark');
    renderWithTheme();
    await userEvent.click(screen.getByTestId('toggle'));
    expect(localStorage.getItem('theme')).toBe('light');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  DOM class manipulation
// ─────────────────────────────────────────────────────────────────────────────
describe('ThemeContext › document.documentElement class', () => {

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('✅ adds "dark" class to <html> when dark mode is active', async () => {
    renderWithTheme();
    await userEvent.click(screen.getByTestId('toggle'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('✅ removes "dark" class from <html> when switching to light mode', async () => {
    localStorage.setItem('theme', 'dark');
    renderWithTheme();
    await userEvent.click(screen.getByTestId('toggle'));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('✅ adds "dark" class on mount when localStorage has theme="dark"', () => {
    localStorage.setItem('theme', 'dark');
    renderWithTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  useTheme hook
// ─────────────────────────────────────────────────────────────────────────────
describe('useTheme hook', () => {

  it('✅ provides isDark boolean', () => {
    renderWithTheme();
    const mode = screen.getByTestId('mode').textContent;
    expect(['light', 'dark']).toContain(mode);
  });

  it('✅ provides toggleTheme function', () => {
    renderWithTheme();
    expect(screen.getByTestId('toggle')).toBeDefined();
  });
});
