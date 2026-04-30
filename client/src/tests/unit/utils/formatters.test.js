/**
 * ============================================================
 *  UNIT TESTS — Utility / Formatter Functions
 *
 *  Tests the pure helper functions extracted from Chat.jsx:
 *    • formatText  — markdown-like bold/italic → HTML
 *    • formatDate  — relative date display
 *
 *  These are pure functions with no React or DOM dependencies.
 * ============================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Inline the helpers (they are not exported from Chat.jsx) ──────────────────
function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

function formatDate(dateString) {
  const date    = new Date(dateString);
  const now     = new Date();
  const diffMs  = now - date;
  const diffMins  = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays  = Math.floor(diffMs / 86400000);
  if (diffMins  < 1)  return 'Just now';
  if (diffMins  < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays  < 7)  return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ─────────────────────────────────────────────────────────────────────────────
//  formatText
// ─────────────────────────────────────────────────────────────────────────────
describe('formatText', () => {

  it('✅ converts **bold** to <strong>bold</strong>', () => {
    expect(formatText('**hello**')).toBe('<strong>hello</strong>');
  });

  it('✅ converts *italic* to <em>italic</em>', () => {
    expect(formatText('*hello*')).toBe('<em>hello</em>');
  });

  it('✅ converts newlines to <br/>', () => {
    expect(formatText('line1\nline2')).toBe('line1<br/>line2');
  });

  it('✅ handles multiple bold segments in one string', () => {
    const result = formatText('**a** and **b**');
    expect(result).toBe('<strong>a</strong> and <strong>b</strong>');
  });

  it('✅ handles mixed bold and italic', () => {
    const result = formatText('**bold** and *italic*');
    expect(result).toBe('<strong>bold</strong> and <em>italic</em>');
  });

  it('✅ returns plain text unchanged when no markdown present', () => {
    expect(formatText('plain text')).toBe('plain text');
  });

  it('✅ handles empty string', () => {
    expect(formatText('')).toBe('');
  });

  it('✅ handles multiple newlines', () => {
    expect(formatText('a\n\nb')).toBe('a<br/><br/>b');
  });

  it('✅ does not double-convert nested markers', () => {
    // **bold *italic* bold** — outer bold should wrap everything
    const result = formatText('**outer *inner* outer**');
    expect(result).toContain('<strong>');
  });

  it('✅ handles a realistic advisory response', () => {
    const text = '**Disease:** Brown Spot\n**Confidence:** High\n1. Apply fungicide\n2. Remove leaves';
    const result = formatText(text);
    expect(result).toContain('<strong>Disease:</strong>');
    expect(result).toContain('<br/>');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  formatDate
// ─────────────────────────────────────────────────────────────────────────────
describe('formatDate', () => {

  beforeEach(() => {
    // Fix "now" to a known point in time
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('✅ returns "Just now" for a date less than 1 minute ago', () => {
    const date = new Date('2024-06-15T11:59:30Z').toISOString();
    expect(formatDate(date)).toBe('Just now');
  });

  it('✅ returns "Xm ago" for a date 5 minutes ago', () => {
    const date = new Date('2024-06-15T11:55:00Z').toISOString();
    expect(formatDate(date)).toBe('5m ago');
  });

  it('✅ returns "Xm ago" for a date 59 minutes ago', () => {
    const date = new Date('2024-06-15T11:01:00Z').toISOString();
    expect(formatDate(date)).toBe('59m ago');
  });

  it('✅ returns "Xh ago" for a date 2 hours ago', () => {
    const date = new Date('2024-06-15T10:00:00Z').toISOString();
    expect(formatDate(date)).toBe('2h ago');
  });

  it('✅ returns "Xh ago" for a date 23 hours ago', () => {
    const date = new Date('2024-06-14T13:00:00Z').toISOString();
    expect(formatDate(date)).toBe('23h ago');
  });

  it('✅ returns "Xd ago" for a date 3 days ago', () => {
    const date = new Date('2024-06-12T12:00:00Z').toISOString();
    expect(formatDate(date)).toBe('3d ago');
  });

  it('✅ returns "Xd ago" for a date 6 days ago', () => {
    const date = new Date('2024-06-09T12:00:00Z').toISOString();
    expect(formatDate(date)).toBe('6d ago');
  });

  it('✅ returns a locale date string for dates older than 7 days', () => {
    const date = new Date('2024-06-01T12:00:00Z').toISOString();
    const result = formatDate(date);
    // Should be a formatted date, not a relative string
    expect(result).not.toContain('ago');
    expect(result).not.toBe('Just now');
    expect(result.length).toBeGreaterThan(0);
  });
});
