export function createChatUI(container) {
  function addUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.textContent = message;
    container.appendChild(messageDiv);
    scrollToBottom();
  }

  function addBotMessage(message, advisory = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    
    // Process markdown-like formatting
    let formattedMessage = message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    
    messageDiv.innerHTML = formattedMessage;
    
    if (advisory) {
      const advisoryDiv = createAdvisorySection(advisory);
      messageDiv.appendChild(advisoryDiv);
    }
    
    container.appendChild(messageDiv);
    scrollToBottom();
  }

  function createAdvisorySection(advisory) {
    const advisoryDiv = document.createElement('div');
    advisoryDiv.className = 'advisory-section';
    
    let html = '<h3>📋 Advisory</h3>';
    
    if (advisory.likelyDisease) {
      html += `<p><strong>Disease:</strong> ${advisory.likelyDisease}</p>`;
    }
    
    if (advisory.confidence) {
      html += `<p><strong>Confidence:</strong> ${advisory.confidence}</p>`;
    }
    
    if (advisory.causeType) {
      html += `<p><strong>Cause:</strong> ${advisory.causeType}</p>`;
    }
    
    if (advisory.recommendedActions && advisory.recommendedActions.length > 0) {
      html += '<h4>Recommended Actions:</h4><ul>';
      advisory.recommendedActions.forEach(action => {
        html += `<li>${action}</li>`;
      });
      html += '</ul>';
    }
    
    if (advisory.preventionTips && advisory.preventionTips.length > 0) {
      html += '<h4>Prevention Tips:</h4><ul>';
      advisory.preventionTips.forEach(tip => {
        html += `<li>${tip}</li>`;
      });
      html += '</ul>';
    }
    
    if (advisory.escalateToAgronomist) {
      html += '<div class="warning"><strong>⚠️ Escalation Required:</strong> This case requires professional attention. Please consult an agronomist or agricultural extension officer as soon as possible.</div>';
    }
    
    if (advisory.bangladeshContext) {
      html += `<p><em>${advisory.bangladeshContext}</em></p>`;
    }
    
    advisoryDiv.innerHTML = html;
    return advisoryDiv;
  }

  function scrollToBottom() {
    container.scrollTop = container.scrollHeight;
  }

  function clearMessages() {
    container.innerHTML = '';
  }

  return {
    addUserMessage,
    addBotMessage,
    createAdvisorySection,
    scrollToBottom,
    clearMessages
  };
}
