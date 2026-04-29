import { advisoryAgent } from '../agents/advisoryAgent.js';
import { imageTool } from '../tools/imageTool.js';
import { Conversation } from '../models/Conversation.js';

// POST /api/chat  — send a message (auth required)
export const chat = async (req, res) => {
  try {
    const { conversationId, message, image, imageMimeType } = req.body;
    const userId = req.user._id;

    console.log('\n=== CHAT CONTROLLER ===');
    console.log('User:', userId, '| Message:', message, '| Has image:', !!image);

    if (!message && !image) {
      return res.status(400).json({ error: 'Message or image is required' });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, userId });
      if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    } else {
      const title = message
        ? (message.length > 50 ? message.substring(0, 47) + '...' : message)
        : '📷 Crop image analysis';
      conversation = await Conversation.create({ userId, title, messages: [] });
      console.log('✓ New conversation:', conversation._id);
    }

    let finalMessage = message || '';

    // ── If image provided, analyze it first ───────────────────────────────────
    if (image) {
      try {
        console.log('→ Analyzing uploaded crop image...');
        const imageAnalysis = await imageTool.analyzeCropImage(image, imageMimeType || 'image/jpeg');

        // Build a rich message from the image analysis
        const imageSummary = [
          imageAnalysis.cropDetected ? `Crop: ${imageAnalysis.cropDetected}` : null,
          imageAnalysis.symptomsObserved?.length > 0
            ? `Symptoms observed: ${imageAnalysis.symptomsObserved.join(', ')}`
            : null,
          imageAnalysis.likelyCondition
            ? `Likely condition: ${imageAnalysis.likelyCondition}`
            : null,
          imageAnalysis.severity ? `Severity: ${imageAnalysis.severity}` : null,
        ].filter(Boolean).join('. ');

        // Combine image analysis with any text message
        finalMessage = message
          ? `${message}\n\n[Image Analysis: ${imageSummary}]`
          : `[Image uploaded by farmer. ${imageSummary}]`;

        console.log('✓ Image analysis complete:', imageSummary);
      } catch (imgErr) {
        console.error('✗ Image analysis failed:', imgErr.message);
        // Continue with just the text message if image analysis fails
        finalMessage = message || 'I uploaded an image of my crop but analysis failed. Can you help?';
      }
    }

    // Add user message to conversation
    conversation.messages.push({
      role: 'user',
      content: message || '📷 Sent a crop photo for analysis',
      imageAnalyzed: !!image
    });

    // Run advisory agent
    const aiResponse = await advisoryAgent.processMessage(finalMessage, conversation);

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

// GET /api/conversations
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

// GET /api/conversations/:id
export const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.user._id });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ conversation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/conversations/:id
export const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ message: 'Conversation deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
