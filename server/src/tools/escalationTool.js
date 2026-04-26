export const escalationTool = {
  shouldEscalate(advisory) {
    // Escalate if any of these conditions are met:
    
    // 1. Disease is marked as high severity
    if (advisory.severity === 'high') {
      return true;
    }
    
    // 2. Confidence is low (less than 50%)
    if (advisory.confidence === 'Low' || advisory.confidence === 'Low') {
      return true;
    }
    
    // 3. Multiple high-severity symptoms
    const highSeveritySymptoms = ['wilt', 'rot', 'stunted', 'dead', 'collapse'];
    const symptomCount = advisory.recommendedActions?.filter(action => 
      highSeveritySymptoms.some(symptom => action.toLowerCase().includes(symptom))
    ).length || 0;
    
    if (symptomCount >= 2) {
      return true;
    }
    
    // 4. Multiple diseases match with similar scores (uncertain diagnosis)
    if (advisory.matchedDiseases && advisory.matchedDiseases.length > 1) {
      const topScores = advisory.matchedDiseases.slice(0, 2).map(d => d.matchScore);
      if (topScores[0] - topScores[1] < 2) { // Small score difference
        return true;
      }
    }
    
    // 5. Viral or bacterial diseases (harder to diagnose visually)
    if (advisory.causeType === 'viral' || advisory.causeType === 'bacterial') {
      return true;
    }
    
    return false;
  },

  getEscalationMessage(advisory) {
    const messages = {
      highSeverity: 'This appears to be a high-severity case. Please consult an agronomist or agricultural extension officer immediately.',
      lowConfidence: 'Based on the information provided, I\'m not confident enough to make a definitive diagnosis. Please consult an expert for accurate identification.',
      viralBacterial: 'Viral and bacterial diseases can be difficult to diagnose visually. An agronomist can provide laboratory confirmation and appropriate treatment.',
      uncertain: 'Multiple diseases have similar symptoms. Professional diagnosis is recommended for accurate identification and treatment.'
    };

    if (advisory.severity === 'high') {
      return messages.highSeverity;
    }
    
    if (advisory.confidence === 'Low') {
      return messages.lowConfidence;
    }
    
    if (advisory.causeType === 'viral' || advisory.causeType === 'bacterial') {
      return messages.viralBacterial;
    }
    
    return messages.uncertain;
  }
};
