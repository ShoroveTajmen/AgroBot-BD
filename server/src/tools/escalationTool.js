/**
 * escalationTool.js — Agronomist Escalation Decision Tool
 *
 * Determines whether a diagnosed crop disease requires referral to a
 * professional agronomist. Called by the advisory agent after a disease
 * has been identified.
 *
 * Escalation is triggered when the case is too complex, uncertain, or
 * severe for the farmer to handle without expert guidance.
 */

export const escalationTool = {

  /**
   * shouldEscalate — Decide if the case needs professional escalation.
   *
   * Checks five escalation conditions in order of severity.
   * Returns true as soon as any condition is met.
   *
   * Escalation conditions:
   *  1. High severity disease — immediate intervention needed
   *  2. Low confidence diagnosis — uncertain, expert needed
   *  3. Two or more high-severity symptoms in recommended actions
   *  4. Multiple diseases with similar match scores — ambiguous diagnosis
   *  5. Viral or bacterial cause — requires lab confirmation
   *
   * @param {object} advisory - { severity, confidence, causeType, recommendedActions, matchedDiseases }
   * @returns {boolean} true if escalation is recommended
   */
  shouldEscalate(advisory) {
    console.log('  → Escalation Tool: Checking if escalation is needed');

    // 1. Disease is marked as high severity
    if (advisory.severity === 'high') {
      console.log('    ✓ Escalation: High severity disease detected');
      return true;
    }

    // 2. Confidence is low — diagnosis is uncertain
    if (advisory.confidence === 'Low') {
      console.log('    ✓ Escalation: Low confidence in diagnosis');
      return true;
    }

    // 3. Multiple high-severity symptoms present in the recommended actions
    // Keywords that indicate critical plant damage
    const highSeveritySymptoms = ['wilt', 'rot', 'stunted', 'dead', 'collapse'];
    const symptomCount = advisory.recommendedActions?.filter(action =>
      highSeveritySymptoms.some(symptom => action.toLowerCase().includes(symptom))
    ).length || 0;

    if (symptomCount >= 2) {
      console.log(`    ✓ Escalation: ${symptomCount} high-severity symptoms detected`);
      return true;
    }

    // 4. Multiple diseases matched with similar scores — diagnosis is ambiguous
    // A score difference < 2 means the top two candidates are nearly equally likely
    if (advisory.matchedDiseases && advisory.matchedDiseases.length > 1) {
      const topScores = advisory.matchedDiseases.slice(0, 2).map(d => d.matchScore);
      if (topScores[0] - topScores[1] < 2) {
        console.log('    ✓ Escalation: Uncertain diagnosis (similar scores)');
        return true;
      }
    }

    // 5. Viral or bacterial diseases — harder to diagnose visually, need lab confirmation
    if (advisory.causeType === 'viral' || advisory.causeType === 'bacterial') {
      console.log(`    ✓ Escalation: ${advisory.causeType} disease requires lab confirmation`);
      return true;
    }

    console.log('    ✗ No escalation needed');
    return false;
  },

  /**
   * getEscalationMessage — Return a human-readable escalation reason message.
   *
   * Provides context-specific messaging based on why escalation was triggered.
   * Used to display a helpful explanation to the farmer alongside the warning.
   *
   * @param {object} advisory - Same advisory object passed to shouldEscalate
   * @returns {string} Escalation reason message
   */
  getEscalationMessage(advisory) {
    const messages = {
      highSeverity:   'This appears to be a high-severity case. Please consult an agronomist or agricultural extension officer immediately.',
      lowConfidence:  'Based on the information provided, I\'m not confident enough to make a definitive diagnosis. Please consult an expert for accurate identification.',
      viralBacterial: 'Viral and bacterial diseases can be difficult to diagnose visually. An agronomist can provide laboratory confirmation and appropriate treatment.',
      uncertain:      'Multiple diseases have similar symptoms. Professional diagnosis is recommended for accurate identification and treatment.'
    };

    if (advisory.severity === 'high')                                    return messages.highSeverity;
    if (advisory.confidence === 'Low')                                   return messages.lowConfidence;
    if (advisory.causeType === 'viral' || advisory.causeType === 'bacterial') return messages.viralBacterial;
    return messages.uncertain;
  }
};
