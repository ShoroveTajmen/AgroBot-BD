import { Session } from '../models/Session.js';

export const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find()
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      sessions: sessions.map(s => ({
        _id: s._id,
        messageCount: s.messages.length,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createSession = async (req, res) => {
  try {
    const session = await Session.create({
      messages: []
    });
    
    res.status(201).json({
      sessionId: session._id,
      createdAt: session.createdAt
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: error.message });
  }
};
