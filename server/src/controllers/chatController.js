import { advisoryAgent } from '../agents/advisoryAgent.js';
import { Conversation } from '../models/Conversation.js';

// POST /api/chat  — send a message (auth required)
export const chat = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    const userId = req.user._id;

    console.log('\n=== CHAT CONTROLLER ===');
    console.log('User:', userId, '| Message:', message);

    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Get or create conversation for this user
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, userId });
      if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    } else {
      // Generate title from first message (truncate to 50 chars)
      const title = message.length > 50 ? message.substring(0, 47) + '...' : message;
      conversation = await Conversation.create({ userId, title, messages: [] });
      console.log('✓ New conversation:', conversation._id);
    }

    // Add user message
    conversation.messages.push({ role: 'user', content: message });

    // Run advisory agent (same logic as before — agent receives session-like object)
    const aiResponse = await advisoryAgent.processMessage(message, conversation);

    // Add AI response
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse.content,
      advisory: aiResponse.advisory || null
    });

    await conversation.save();
    console.log('✓ Saved. Messages:', conversation.messages.length);
    console.log('=== END CHAT CONTROLLER ===\n');

    res.json({
      conversationId: conversation._id,
      response: { content: aiResponse.content, advisory: aiResponse.advisory }
    });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/conversations  — list user's conversations
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select('_id title updatedAt messages');

    res.json({
      conversations: conversations.map(c => ({
        _id: c._id,
        title: c.title,
        messageCount: c.messages.length,
        lastMessage: c.messages.length > 0 ? c.messages[c.messages.length - 1].content.substring(0, 60) : '',
        updatedAt: c.updatedAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/conversations/:id  — get full conversation history
export const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.user._id });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ conversation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/conversations/:id  — delete a conversation
export const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ message: 'Conversation deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
