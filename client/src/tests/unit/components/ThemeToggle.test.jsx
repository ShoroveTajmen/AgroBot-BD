/**
 * ============================================================
 *  UNIT TESTS — ThemeToggle component
 *
 *  Tests rendering, icon switching, and click behaviour.
 * ============================================================
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from '../../../components/ThemeToggle.jsx';
import { ThemeProvider } from '../../../context/ThemeContext.jsx';

// ── Wrapper that provides ThemeContext ────────────────────────────────────────
function renderToggle(props = {}) {
  return render(
    <ThemeProvider>
      <ThemeToggle {...props} />
    </ThemeProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Rendering
// ─────────────────────────────────────────────────────────────────────────────
describe('ThemeToggle › rendering', () => {

  it('✅ renders a button element', () => {
    renderToggle();
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('✅ button has a title attribute', () => {
    renderToggle();
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('title')).toBeTruthy();
  });

  it('✅ title says "Switch to Dark Mode" in light mode', () => {
    localStorage.removeItem('theme');
    renderToggle();
    expect(screen.getByRole('button').getAttribute('title')).toContain('Dark Mode');
  });

  it('✅ title says "Switch to Light Mode" in dark mode', () => {
    localStorage.setItem('theme', 'dark');
    renderToggle();
    expect(screen.getByRole('button').getAttribute('title')).toContain('Light Mode');
  });

  it('✅ accepts and applies a custom className', () => {
    renderToggle({ className: 'my-custom-class' });
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('my-custom-class');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Click behaviour
// ─────────────────────────────────────────────────────────────────────────────
describe('ThemeToggle › click behaviour', () => {

  it('✅ clicking the button toggles the theme', async () => {
    localStorage.removeItem('theme');
    renderToggle();
    const btn = screen.getByRole('button');

    // Start in light mode
    expect(btn.getAttribute('title')).toContain('Dark Mode');

    await userEvent.click(btn);

    // Now in dark mode
    expect(btn.getAttribute('title')).toContain('Light Mode');
  });

  it('✅ clicking twice returns to original theme', async () => {
    localStorage.removeItem('theme');
    renderToggle();
    const btn = screen.getByRole('button');

    await userEvent.click(btn);
    await userEvent.click(btn);

    expect(btn.getAttribute('title')).toContain('Dark Mode');
  });

  it('✅ clicking updates localStorage', async () => {
    localStorage.removeItem('theme');
    renderToggle();
    await userEvent.click(screen.getByRole('button'));
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
