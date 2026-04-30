/**
 * ============================================================
 *  UNIT TESTS — escalationTool
 *
 *  Tests every escalation condition and message generation.
 *  Pure logic — no external dependencies.
 * ============================================================
 */

import { describe, it, expect } from 'vitest';
import { escalationTool } from '../../../tools/escalationTool.js';

// ─────────────────────────────────────────────────────────────────────────────
//  shouldEscalate
// ─────────────────────────────────────────────────────────────────────────────
describe('escalationTool › shouldEscalate', () => {

  // ── Condition 1: high severity ───────────────────────────────────────────────
  describe('high severity', () => {
    it('✅ escalates when severity is "high"', () => {
      expect(escalationTool.shouldEscalate({
        likelyDisease: 'Rice Blast',
        severity: 'high',
        confidence: 'High',
        causeType: 'fungal',
      })).toBe(true);
    });

    it('✅ does NOT escalate when severity is "medium" (all else safe)', () => {
      expect(escalationTool.shouldEscalate({
        likelyDisease: 'Brown Spot',
        severity: 'medium',
        confidence: 'High',
        causeType: 'fungal',
      })).toBe(false);
    });

    it('✅ does NOT escalate when severity is "low" (all else safe)', () => {
      expect(escalationTool.shouldEscalate({
        likelyDisease: 'Common Rust',
        severity: 'low',
        confidence: 'High',
        causeType: 'fungal',
      })).toBe(false);
    });
  });

  // ── Condition 2: low confidence ──────────────────────────────────────────────
  describe('low confidence', () => {
    it('✅ escalates when confidence is "Low"', () => {
      expect(escalationTool.shouldEscalate({
        likelyDisease: 'Unknown',
        severity: 'medium',
        confidence: 'Low',
        causeType: 'fungal',
      })).toBe(true);
    });

    it('✅ does NOT escalate when confidence is "High"', () => {
      expect(escalationTool.shouldEscalate({
        likelyDisease: 'Brown Spot',
        severity: 'medium',
        confidence: 'High',
        causeType: 'fungal',
      })).toBe(false);
    });

    it('✅ does NOT escalate when confidence is "Medium" (all else safe)', () => {
      expect(escalationTool.shouldEscalate({
        likelyDisease: 'Brown Spot',
        severity: 'medium',
        confidence: 'Medium',
        causeType: 'fungal',
      })).toBe(false);
    });
  });

  // ── Condition 3: viral / bacterial cause ─────────────────────────────────────
  describe('viral and bacterial diseases', () => {
    it('✅ escalates for viral causeType', () => {
      expect(escalationTool.shouldEscalate({
        likelyDisease: 'Tungro',
        severity: 'medium',
        confidence: 'High',
        causeType: 'viral',
      })).toBe(true);
    });

    it('✅ escalates for bacterial causeType', () => {
      expect(escalationTool.shouldEscalate({
        likelyDisease: 'Bacterial Blight',
        severity: 'medium',
        confidence: 'High',
        causeType: 'bacterial',
      })).toBe(true);
    });

    it('✅ does NOT escalate for fungal causeType (all else safe)', () => {
      expect(escalationTool.shouldEscalate({
        likelyDisease: 'Brown Spot',
        severity: 'medium',
        confidence: 'High',
        causeType: 'fungal',
      })).toBe(false);
    });

    it('✅ does NOT escalate for pest causeType (all else safe)', () => {
      expect(escalationTool.shouldEscalate({
        likelyDisease: 'Stem Borer',
        severity: 'medium',
        confidence: 'High',
        causeType: 'pest',
      })).toBe(false);
    });
  });

  // ── Condition 4: multiple high-severity symptoms in recommendedActions ────────
  describe('multiple high-severity symptom keywords', () => {
    it('✅ escalates when 2+ high-severity keywords appear in recommendedActions', () => {
      expect(escalationTool.shouldEscalate({
        likelyDisease: 'Root Rot',
        severity: 'medium',
        confidence: 'High',
        causeType: 'fungal',
        recommendedActions: [
          'Remove wilted plants immediately',
          'Treat root rot with fungicide',
        ],
      })).toBe(true);
    });

    it('✅ does NOT escalate when only 1 high-severity keyword appears', () => {
      expect(escalationTool.shouldEscalate({
        likelyDisease: 'Brown Spot',
        severity: 'medium',
        confidence: 'High',
        causeType: 'fungal',
        recommendedActions: [
          'Apply fungicide to wilted areas',
          'Ensure proper drainage',
        ],
      })).toBe(false);
    });

    it('✅ handles missing recommendedActions gracefully', () => {
      expect(() => escalationTool.shouldEscalate({
        likelyDisease: 'Brown Spot',
        severity: 'medium',
        confidence: 'High',
        causeType: 'fungal',
      })).not.toThrow();
    });
  });

  // ── Condition 5: uncertain diagnosis (similar match scores) ──────────────────
  describe('uncertain diagnosis', () => {
    it('✅ escalates when top 2 diseases have very similar scores (diff < 2)', () => {
      expect(escalationTool.shouldEscalate({
        likelyDisease: 'Unknown',
        severity: 'medium',
        confidence: 'High',
        causeType: 'fungal',
        matchedDiseases: [
          { diseaseName: 'Disease A', matchScore: 5 },
          { diseaseName: 'Disease B', matchScore: 4 },
        ],
      })).toBe(true);
    });

    it('✅ does NOT escalate when top disease has a clearly higher score (diff >= 2)', () => {
      expect(escalationTool.shouldEscalate({
        likelyDisease: 'Brown Spot',
        severity: 'medium',
        confidence: 'High',
        causeType: 'fungal',
        matchedDiseases: [
          { diseaseName: 'Brown Spot', matchScore: 8 },
          { diseaseName: 'Leaf Blight', matchScore: 3 },
        ],
      })).toBe(false);
    });

    it('✅ handles single matched disease without escalating', () => {
      expect(escalationTool.shouldEscalate({
        likelyDisease: 'Brown Spot',
        severity: 'medium',
        confidence: 'High',
        causeType: 'fungal',
        matchedDiseases: [
          { diseaseName: 'Brown Spot', matchScore: 8 },
        ],
      })).toBe(false);
    });
  });

  // ── Combined conditions ───────────────────────────────────────────────────────
  describe('combined conditions', () => {
    it('✅ escalates when both high severity AND viral (first condition wins)', () => {
      expect(escalationTool.shouldEscalate({
        likelyDisease: 'Tungro',
        severity: 'high',
        confidence: 'High',
        causeType: 'viral',
      })).toBe(true);
    });

    it('✅ escalates when low confidence AND bacterial', () => {
      expect(escalationTool.shouldEscalate({
        likelyDisease: 'Bacterial Leaf Blight',
        severity: 'medium',
        confidence: 'Low',
        causeType: 'bacterial',
      })).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  getEscalationMessage
// ─────────────────────────────────────────────────────────────────────────────
describe('escalationTool › getEscalationMessage', () => {

  it('✅ returns a non-empty string', () => {
    const msg = escalationTool.getEscalationMessage({ severity: 'high' });
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('✅ high-severity message mentions agronomist or severity', () => {
    const msg = escalationTool.getEscalationMessage({ severity: 'high' });
    const lower = msg.toLowerCase();
    expect(lower.includes('high-severity') || lower.includes('agronomist') || lower.includes('immediately')).toBe(true);
  });

  it('✅ low-confidence message mentions confidence or expert', () => {
    const msg = escalationTool.getEscalationMessage({ severity: 'medium', confidence: 'Low' });
    const lower = msg.toLowerCase();
    expect(lower.includes('confident') || lower.includes('expert') || lower.includes('diagnosis')).toBe(true);
  });

  it('✅ viral disease message mentions viral or lab', () => {
    const msg = escalationTool.getEscalationMessage({ severity: 'medium', confidence: 'High', causeType: 'viral' });
    const lower = msg.toLowerCase();
    expect(lower.includes('viral') || lower.includes('lab') || lower.includes('laboratory')).toBe(true);
  });

  it('✅ bacterial disease message mentions bacterial or lab', () => {
    const msg = escalationTool.getEscalationMessage({ severity: 'medium', confidence: 'High', causeType: 'bacterial' });
    const lower = msg.toLowerCase();
    expect(lower.includes('bacterial') || lower.includes('lab') || lower.includes('laboratory')).toBe(true);
  });

  it('✅ fallback message is returned for uncertain cases', () => {
    const msg = escalationTool.getEscalationMessage({ severity: 'medium', confidence: 'Medium', causeType: 'fungal' });
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });
});
