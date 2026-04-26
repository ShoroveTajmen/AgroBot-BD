import { ChatService } from './services/ChatService.js';
import { createChatUI } from './components/ChatUI.js';

// Initialize chat service
const chatService = new ChatService();

// Get DOM elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// Create initial UI
const chatUI = createChatUI(chatMessages);

// Load saved session
const savedSessionId = localStorage.getItem('agrobot_sessionId');
if (savedSessionId) {
  chatService.sessionId = savedSessionId;
}

// Welcome message
chatUI.addBotMessage('Hello! I\'m AgroBot BD, your agricultural assistant. I can help you identify crop diseases and provide practical advice. Could you tell me about the problem you\'re experiencing with your crops?');

// Event listeners
sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleSendMessage();
  }
});

async function handleSendMessage() {
  const message = userInput.value.trim();
  
  if (!message) return;
  
  // Add user message to UI
  chatUI.addUserMessage(message);
  userInput.value = '';
  
  // Disable input while loading
  userInput.disabled = true;
  sendBtn.disabled = true;
  
  try {
    // Get AI response
    const response = await chatService.sendMessage(message);
    
    // Save session ID
    if (response.sessionId) {
      localStorage.setItem('agrobot_sessionId', response.sessionId);
      chatService.sessionId = response.sessionId;
    }
    
    // Add bot message to UI
    chatUI.addBotMessage(response.response.content, response.response.advisory);
  } catch (error) {
    console.error('Error sending message:', error);
    chatUI.addBotMessage(`Sorry, I encountered an error: ${error.message}. Please try again.`);
  } finally {
    // Re-enable input
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
}
