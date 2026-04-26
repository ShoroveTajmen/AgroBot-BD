import { advisoryAgent } from '../agents/advisoryAgent.js';
import { Session } from '../models/Session.js';

export const chat = async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    console.log('\n=== CHAT CONTROLLER ===');
    console.log('Session ID:', sessionId || 'new');
    console.log('User message:', message);

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create session
    let session;
    if (sessionId) {
      session = await Session.findById(sessionId);
      console.log('Found existing session');
    } else {
      session = await Session.create({
        messages: []
      });
      console.log('Created new session');
    }

    // Add user message to session
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Get AI response
    console.log('→ Processing with advisory agent...');
    const aiResponse = await advisoryAgent.processMessage(message, session);

    // Add AI response to session
    session.messages.push({
      role: 'assistant',
      content: aiResponse.content,
      advisory: aiResponse.advisory,
      timestamp: new Date()
    });

    await session.save();
    console.log('Session saved');

    console.log('=== END CHAT CONTROLLER ===\n');

    res.json({
      sessionId: session._id,
      response: {
        content: aiResponse.content,
        advisory: aiResponse.advisory
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
};
