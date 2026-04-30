/**
 * ============================================================
 *  UNIT TESTS — cropKnowledgeTool
 *
 *  Tests the local crop-disease knowledge base search logic.
 *  No external dependencies — reads the bundled JSON file.
 *
 *  Return shape for KNOWN crops:
 *    { crop, symptoms, diseases[], totalMatches }
 *
 *  Return shape for UNKNOWN crops:
 *    { found: false, message, diseases: [], totalMatches: 0, supportedCrops[] }
 * ============================================================
 */

import { describe, it, expect } from 'vitest';
import { cropKnowledgeTool } from '../../../tools/cropKnowledgeTool.js';

// ─────────────────────────────────────────────────────────────────────────────
//  searchDiseases — return shape
// ─────────────────────────────────────────────────────────────────────────────
describe('cropKnowledgeTool › searchDiseases', () => {

  describe('return shape for known crops', () => {
    it('✅ always returns an object with crop, diseases, and totalMatches', () => {
      const result = cropKnowledgeTool.searchDiseases('Rice', ['brown spots']);
      expect(result).toHaveProperty('crop');
      expect(result).toHaveProperty('diseases');
      expect(result).toHaveProperty('totalMatches');
    });

    it('✅ diseases is always an array', () => {
      const result = cropKnowledgeTool.searchDiseases('Rice', ['spots']);
      expect(Array.isArray(result.diseases)).toBe(true);
    });

    it('✅ totalMatches equals diseases array length', () => {
      const result = cropKnowledgeTool.searchDiseases('Rice', ['brown spots']);
      expect(result.totalMatches).toBe(result.diseases.length);
    });
  });

  // ── Known crops ─────────────────────────────────────────────────────────────
  describe('known crops', () => {
    it('✅ finds diseases for Rice', () => {
      const result = cropKnowledgeTool.searchDiseases('Rice', ['brown spots', 'yellowing']);
      expect(result.diseases.length).toBeGreaterThan(0);
    });

    it('✅ finds diseases for Wheat', () => {
      const result = cropKnowledgeTool.searchDiseases('Wheat', ['rust', 'yellow stripes']);
      expect(result.diseases.length).toBeGreaterThan(0);
    });

    it('✅ finds diseases for Potato', () => {
      const result = cropKnowledgeTool.searchDiseases('Potato', ['dark spots', 'wilting']);
      expect(result.diseases.length).toBeGreaterThan(0);
    });

    it('✅ finds diseases for Tomato', () => {
      const result = cropKnowledgeTool.searchDiseases('Tomato', ['leaf curl', 'yellowing']);
      expect(result.diseases.length).toBeGreaterThan(0);
    });

    it('✅ finds diseases for Maize', () => {
      const result = cropKnowledgeTool.searchDiseases('Maize', ['blight', 'lesions']);
      expect(result.diseases.length).toBeGreaterThan(0);
    });
  });

  // ── Case-insensitivity ───────────────────────────────────────────────────────
  describe('case-insensitive crop name matching', () => {
    it('✅ lowercase "rice" finds same number of diseases as "Rice"', () => {
      const lower = cropKnowledgeTool.searchDiseases('rice', ['brown spots']);
      const upper = cropKnowledgeTool.searchDiseases('Rice', ['brown spots']);
      expect(lower.diseases.length).toBe(upper.diseases.length);
    });

    it('✅ uppercase "WHEAT" finds same diseases as "Wheat"', () => {
      const upper = cropKnowledgeTool.searchDiseases('WHEAT', ['rust']);
      const title = cropKnowledgeTool.searchDiseases('Wheat', ['rust']);
      expect(upper.diseases.length).toBe(title.diseases.length);
    });

    it('✅ mixed-case "tOmAtO" still finds results', () => {
      const result = cropKnowledgeTool.searchDiseases('tOmAtO', ['spots']);
      expect(result.diseases.length).toBeGreaterThan(0);
    });
  });

  // ── Unknown crops ────────────────────────────────────────────────────────────
  describe('unknown / unsupported crops', () => {
    it('✅ returns found=false for an unknown crop', () => {
      const result = cropKnowledgeTool.searchDiseases('UnknownCrop123', ['spots']);
      expect(result.found).toBe(false);
    });

    it('✅ returns empty diseases array for unknown crop', () => {
      const result = cropKnowledgeTool.searchDiseases('Avocado', ['brown spots']);
      expect(result.diseases).toEqual([]);
    });

    it('✅ returns totalMatches = 0 for unknown crop', () => {
      const result = cropKnowledgeTool.searchDiseases('Strawberry', ['mold']);
      expect(result.totalMatches).toBe(0);
    });

    it('✅ includes supportedCrops list in the not-found response', () => {
      const result = cropKnowledgeTool.searchDiseases('Papaya', ['yellowing']);
      expect(result.supportedCrops).toBeDefined();
      expect(Array.isArray(result.supportedCrops)).toBe(true);
      expect(result.supportedCrops.length).toBeGreaterThan(0);
    });

    it('✅ not-found message mentions the crop name', () => {
      const result = cropKnowledgeTool.searchDiseases('Papaya', ['yellowing']);
      expect(result.message).toContain('Papaya');
    });
  });

  // ── Symptom scoring ──────────────────────────────────────────────────────────
  describe('symptom-based scoring', () => {
    it('✅ Brown Spot disease has a high score when "brown spots" symptom is given for Rice', () => {
      const result = cropKnowledgeTool.searchDiseases('Rice', ['brown spots on leaves']);
      const brownSpot = result.diseases.find(d =>
        d.diseaseName?.toLowerCase().includes('brown spot')
      );
      expect(brownSpot).toBeDefined();
      expect(brownSpot.matchScore).toBeGreaterThanOrEqual(1);
    });

    it('✅ diseases are sorted by matchScore descending', () => {
      const result = cropKnowledgeTool.searchDiseases('Rice', ['blast', 'lesions', 'neck rot']);
      if (result.diseases.length >= 2) {
        expect(result.diseases[0].matchScore).toBeGreaterThanOrEqual(result.diseases[1].matchScore);
      }
    });

    it('✅ more specific symptoms yield more matches', () => {
      const vague   = cropKnowledgeTool.searchDiseases('Rice', ['spots']);
      const precise = cropKnowledgeTool.searchDiseases('Rice', ['brown spots', 'yellowing', 'lesions']);
      // Precise query should find at least as many diseases
      expect(precise.totalMatches).toBeGreaterThanOrEqual(vague.totalMatches);
    });

    it('✅ returns at most 5 diseases (top matches only)', () => {
      const result = cropKnowledgeTool.searchDiseases('Rice', ['spots', 'yellowing', 'wilting']);
      expect(result.diseases.length).toBeLessThanOrEqual(5);
    });

    it('✅ each disease object has diseaseName and matchScore', () => {
      const result = cropKnowledgeTool.searchDiseases('Rice', ['brown spots']);
      result.diseases.forEach(d => {
        expect(d).toHaveProperty('diseaseName');
        expect(d).toHaveProperty('matchScore');
      });
    });
  });

  // ── Edge cases ───────────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('✅ handles empty symptoms array gracefully', () => {
      const result = cropKnowledgeTool.searchDiseases('Rice', []);
      expect(result).toBeDefined();
      expect(Array.isArray(result.diseases)).toBe(true);
    });

    it('✅ handles whitespace-padded crop name', () => {
      const result = cropKnowledgeTool.searchDiseases('  rice  ', ['spots']);
      // The tool trims the name, so it should find diseases
      expect(result.diseases.length).toBeGreaterThan(0);
    });

    it('✅ handles single-word symptom', () => {
      const result = cropKnowledgeTool.searchDiseases('Wheat', ['rust']);
      expect(result).toBeDefined();
    });
  });
});
