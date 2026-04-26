import { advisoryAgent } from '../agents/advisoryAgent.js';
import { Session } from '../models/Session.js';

export const chat = async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create session
    let session;
    if (sessionId) {
      session = await Session.findById(sessionId);
    }
    
    if (!session) {
      session = await Session.create({
        messages: []
      });
    }

    // Add user message to session
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Get AI response
    const aiResponse = await advisoryAgent.processMessage(message, session);

    // Add AI response to session
    session.messages.push({
      role: 'assistant',
      content: aiResponse.content,
      advisory: aiResponse.advisory,
      timestamp: new Date()
    });

    await session.save();

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
