/**
 * ============================================================
 *  UNIT TESTS — weatherTool
 *
 *  Tests mock-data fallback, condition mapping, and weather
 *  impact message generation.  The real OpenWeatherMap API
 *  is never called — we stub global fetch.
 * ============================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { weatherTool } from '../../../tools/weatherTool.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────
const KNOWN_DISTRICTS = ['dhaka', 'chittagong', 'rajshahi', 'khulna', 'barisal', 'sylhet', 'rangpur', 'mymensingh'];

// ─────────────────────────────────────────────────────────────────────────────
//  getWeather — mock-data path (no API key)
// ─────────────────────────────────────────────────────────────────────────────
describe('weatherTool › getWeather (mock data fallback)', () => {

  beforeEach(() => {
    // Ensure no API key so we always hit the mock path
    delete process.env.OPENWEATHER_API_KEY;
  });

  it('✅ returns an object with required keys for a known district', async () => {
    const result = await weatherTool.getWeather('dhaka');
    expect(result).toHaveProperty('location');
    expect(result).toHaveProperty('temperature');
    expect(result).toHaveProperty('humidity');
    expect(result).toHaveProperty('rainfall');
    expect(result).toHaveProperty('condition');
    expect(result).toHaveProperty('source');
    expect(result).toHaveProperty('message');
  });

  it('✅ source is "mock" when no API key is set', async () => {
    const result = await weatherTool.getWeather('dhaka');
    expect(result.source).toBe('mock');
  });

  it('✅ returns numeric temperature for Dhaka', async () => {
    const result = await weatherTool.getWeather('dhaka');
    expect(typeof result.temperature).toBe('number');
  });

  it('✅ returns numeric humidity for Dhaka', async () => {
    const result = await weatherTool.getWeather('dhaka');
    expect(typeof result.humidity).toBe('number');
  });

  it('✅ returns data for all 8 known Bangladesh districts', async () => {
    for (const district of KNOWN_DISTRICTS) {
      const result = await weatherTool.getWeather(district);
      expect(result.temperature).toBeGreaterThan(0);
      expect(result.humidity).toBeGreaterThan(0);
    }
  });

  it('✅ handles case-insensitive district names', async () => {
    const lower = await weatherTool.getWeather('dhaka');
    const upper = await weatherTool.getWeather('DHAKA');
    const title = await weatherTool.getWeather('Dhaka');
    expect(lower.temperature).toBe(upper.temperature);
    expect(lower.temperature).toBe(title.temperature);
  });

  it('✅ returns fallback data for an unknown district', async () => {
    const result = await weatherTool.getWeather('UnknownDistrict');
    expect(result).toHaveProperty('temperature');
    expect(result).toHaveProperty('humidity');
    expect(result.source).toBe('mock');
  });

  it('✅ message is a non-empty string', async () => {
    const result = await weatherTool.getWeather('sylhet');
    expect(typeof result.message).toBe('string');
    expect(result.message.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  getWeather — real API path (stubbed fetch)
// ─────────────────────────────────────────────────────────────────────────────
describe('weatherTool › getWeather (real API path — stubbed fetch)', () => {

  const mockApiResponse = {
    main: { temp: 31.5, humidity: 78 },
    rain: { '1h': 2.5 },
    weather: [{ main: 'Rain', description: 'moderate rain' }],
  };

  beforeEach(() => {
    process.env.OPENWEATHER_API_KEY = 'fake-api-key-for-test';
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });
  });

  afterEach(() => {
    delete process.env.OPENWEATHER_API_KEY;
    vi.restoreAllMocks();
  });

  it('✅ calls fetch when API key is present', async () => {
    await weatherTool.getWeather('dhaka');
    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it('✅ returns temperature from API response', async () => {
    const result = await weatherTool.getWeather('dhaka');
    expect(result.temperature).toBe(32); // Math.round(31.5)
  });

  it('✅ returns humidity from API response', async () => {
    const result = await weatherTool.getWeather('dhaka');
    expect(result.humidity).toBe(78);
  });

  it('✅ returns rainfall from API response', async () => {
    const result = await weatherTool.getWeather('dhaka');
    expect(result.rainfall).toBe(2.5);
  });

  it('✅ source is "OpenWeatherMap" when API succeeds', async () => {
    const result = await weatherTool.getWeather('dhaka');
    expect(result.source).toBe('OpenWeatherMap');
  });

  it('✅ falls back to mock data when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const result = await weatherTool.getWeather('dhaka');
    expect(result.source).toBe('mock');
  });

  it('✅ falls back to mock data when API returns non-ok status', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    const result = await weatherTool.getWeather('dhaka');
    expect(result.source).toBe('mock');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  mapCondition
// ─────────────────────────────────────────────────────────────────────────────
describe('weatherTool › mapCondition', () => {

  it('✅ maps "Rain" to "Rainy"', () => {
    expect(weatherTool.mapCondition('Rain', 60)).toBe('Rainy');
  });

  it('✅ maps "Thunderstorm" to "Stormy"', () => {
    expect(weatherTool.mapCondition('Thunderstorm', 80)).toBe('Stormy');
  });

  it('✅ maps "Clear" with high humidity to "Humid"', () => {
    expect(weatherTool.mapCondition('Clear', 75)).toBe('Humid');
  });

  it('✅ maps "Clear" with low humidity to "Warm"', () => {
    expect(weatherTool.mapCondition('Clear', 50)).toBe('Warm');
  });

  it('✅ maps "Mist" to "Humid"', () => {
    expect(weatherTool.mapCondition('Mist', 90)).toBe('Humid');
  });

  it('✅ maps "Snow" to "Cold"', () => {
    expect(weatherTool.mapCondition('Snow', 60)).toBe('Cold');
  });

  it('✅ returns "Moderate" for unknown OWM condition', () => {
    expect(weatherTool.mapCondition('Tornado', 60)).toBe('Moderate');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  generateWeatherImpactMessage
// ─────────────────────────────────────────────────────────────────────────────
describe('weatherTool › generateWeatherImpactMessage', () => {

  it('✅ mentions fungal disease risk when humidity > 70', () => {
    const msg = weatherTool.generateWeatherImpactMessage({ humidity: 80, rainfall: 5, temperature: 28 });
    expect(msg.toLowerCase()).toContain('fungal');
  });

  it('✅ mentions rainfall risk when rainfall > 15', () => {
    const msg = weatherTool.generateWeatherImpactMessage({ humidity: 60, rainfall: 20, temperature: 28 });
    expect(msg.toLowerCase()).toContain('rainfall');
  });

  it('✅ mentions pest reproduction when temperature > 33', () => {
    const msg = weatherTool.generateWeatherImpactMessage({ humidity: 60, rainfall: 5, temperature: 35 });
    expect(msg.toLowerCase()).toContain('pest');
  });

  it('✅ mentions fungal disease for cool temperatures (< 25)', () => {
    const msg = weatherTool.generateWeatherImpactMessage({ humidity: 60, rainfall: 5, temperature: 22 });
    expect(msg.toLowerCase()).toContain('fungal');
  });

  it('✅ returns moderate conditions message when all values are normal', () => {
    const msg = weatherTool.generateWeatherImpactMessage({ humidity: 60, rainfall: 5, temperature: 28 });
    expect(msg.toLowerCase()).toContain('moderate');
  });

  it('✅ returns a non-empty string in all cases', () => {
    const msg = weatherTool.generateWeatherImpactMessage({ humidity: 50, rainfall: 0, temperature: 30 });
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });
});
