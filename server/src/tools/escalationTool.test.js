import { describe, it, expect } from 'vitest';
import { escalationTool } from './escalationTool.js';

describe('escalationTool', () => {
  describe('shouldEscalate', () => {
    it('should escalate for high severity diseases', () => {
      const advisory = {
        likelyDisease: 'Blast',
        severity: 'high',
        confidence: 'High',
        causeType: 'Fungal'
      };
      
      expect(escalationTool.shouldEscalate(advisory)).toBe(true);
    });

    it('should escalate for low confidence', () => {
      const advisory = {
        likelyDisease: 'Unknown',
        severity: 'medium',
        confidence: 'Low',
        causeType: 'Unknown'
      };
      
      expect(escalationTool.shouldEscalate(advisory)).toBe(true);
    });

    it('should escalate for viral diseases', () => {
      const advisory = {
        likelyDisease: 'Tungro',
        severity: 'high',
        confidence: 'High',
        causeType: 'Viral'
      };
      
      expect(escalationTool.shouldEscalate(advisory)).toBe(true);
    });

    it('should not escalate for medium severity with high confidence', () => {
      const advisory = {
        likelyDisease: 'Brown Spot',
        severity: 'medium',
        confidence: 'High',
        causeType: 'Fungal'
      };
      
      expect(escalationTool.shouldEscalate(advisory)).toBe(false);
    });

    it('should not escalate for low severity', () => {
      const advisory = {
        likelyDisease: 'Common Rust',
        severity: 'low',
        confidence: 'High',
        causeType: 'Fungal'
      };
      
      expect(escalationTool.shouldEscalate(advisory)).toBe(false);
    });
  });

  describe('getEscalationMessage', () => {
    it('should return appropriate message for high severity', () => {
      const advisory = { severity: 'high' };
      const message = escalationTool.getEscalationMessage(advisory);
      
      expect(message).toContain('high-severity');
    });

    it('should return appropriate message for viral disease', () => {
      const advisory = { causeType: 'viral' };
      const message = escalationTool.getEscalationMessage(advisory);
      
      expect(message).toContain('viral');
    });
  });
});
