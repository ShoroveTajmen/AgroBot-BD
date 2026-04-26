import { describe, it, expect, beforeEach } from 'vitest';
import { cropKnowledgeTool } from './cropKnowledgeTool.js';

describe('cropKnowledgeTool', () => {
  describe('searchDiseases', () => {
    it('should find diseases for rice crop', () => {
      const symptoms = ['brown spots on leaves', 'yellowing'];
      const result = cropKnowledgeTool.searchDiseases('Rice', symptoms);
      
      expect(result.crop).toBe('Rice');
      expect(result.diseases).toBeInstanceOf(Array);
      expect(result.totalMatches).toBeGreaterThanOrEqual(0);
    });

    it('should handle case-insensitive crop names', () => {
      const symptoms = ['brown spots'];
      const result = cropKnowledgeTool.searchDiseases('rice', symptoms);
      
      expect(result.crop).toBe('rice');
    });

    it('should return empty array for unknown crop', () => {
      const symptoms = ['some symptoms'];
      const result = cropKnowledgeTool.searchDiseases('UnknownCrop', symptoms);
      
      expect(result.diseases).toEqual([]);
    });

    it('should score diseases based on symptom matching', () => {
      const symptoms = ['brown spots on leaves'];
      const result = cropKnowledgeTool.searchDiseases('Rice', symptoms);
      
      // Brown Spot should have high score
      const brownSpot = result.diseases.find(d => d.diseaseName === 'Brown Spot');
      expect(brownSpot).toBeDefined();
      expect(brownSpot.matchScore).toBeGreaterThanOrEqual(2);
    });
  });
});
