/**
 * chatController.js — Chat & Conversation Request Handlers
 *
 * Handles the full lifecycle of a chat message:
 *   1. Validate the request
 *   2. Get or create a Conversation in MongoDB
 *   3. Analyze any uploaded image via imageTool (GPT-4o Vision)
 *   4. Run the advisory agent to generate an AI response
 *   5. Persist both messages and return the response
 *
 * Also handles conversation management: list, get, and delete.
 *
 * Exported handlers:
 *   chat               — POST   /api/chat
 *   getConversations   — GET    /api/conversations
 *   getConversation    — GET    /api/conversations/:id
 *   deleteConversation — DELETE /api/conversations/:id
 */

import { advisoryAgent } from '../agents/advisoryAgent.js';
import { imageTool } from '../tools/imageTool.js';
import { Conversation } from '../models/Conversation.js';

/**
 * chat — Process an incoming message and return an AI advisory response.
 *
 * Supports both text-only and image+text messages.
 * If an image is provided, it is analyzed by GPT-4o Vision first and the
 * analysis summary is appended to the message text before the advisory agent runs.
 *
 * @param {object} req.body - { conversationId?, message?, image?, imageMimeType? }
 * @param {object} req.user - Authenticated user (set by authMiddleware)
 * @returns {200} { conversationId, response: { content, advisory } }
 * @returns {400} If neither message nor image is provided
 * @returns {404} If conversationId is provided but not found for this user
 */
export const chat = async (req, res) => {
  try {
    const { conversationId, message, image, imageMimeType } = req.body;
    const userId = req.user._id;

    console.log('\n=== CHAT CONTROLLER ===');
    console.log('User:', userId, '| Message:', message, '| Has image:', !!image);

    // At least one of message or image must be present
    if (!message && !image) {
      return res.status(400).json({ error: 'Message or image is required' });
    }

    // ── Get or create conversation ────────────────────────────────────────────
    let conversation;
    if (conversationId) {
      // Load existing conversation — userId check prevents accessing other users' data
      conversation = await Conversation.findOne({ _id: conversationId, userId });
      if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    } else {
      // Create a new conversation with a title derived from the first message
      const title = message
        ? (message.length > 50 ? message.substring(0, 47) + '...' : message)
        : '📷 Crop image analysis';
      conversation = await Conversation.create({ userId, title, messages: [] });
      console.log('✓ New conversation:', conversation._id);
    }

    let finalMessage = message || '';

    // ── Image analysis (if image provided) ───────────────────────────────────
    if (image) {
      try {
        console.log('→ Analyzing uploaded crop image...');
        const imageAnalysis = await imageTool.analyzeCropImage(image, imageMimeType || 'image/jpeg');

        // Build a structured summary from the vision analysis result
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

        // Merge image analysis with any text the farmer typed
        finalMessage = message
          ? `${message}\n\n[Image Analysis: ${imageSummary}]`
          : `[Image uploaded by farmer. ${imageSummary}]`;

        console.log('✓ Image analysis complete:', imageSummary);
      } catch (imgErr) {
        console.error('✗ Image analysis failed:', imgErr.message);
        // Gracefully fall back to text-only if vision analysis fails
        finalMessage = message || 'I uploaded an image of my crop but analysis failed. Can you help?';
      }
    }

    // ── Save user message to conversation ─────────────────────────────────────
    conversation.messages.push({
      role: 'user',
      content: message || '📷 Sent a crop photo for analysis',
      imageAnalyzed: !!image
    });

    // ── Run the advisory agent ────────────────────────────────────────────────
    // Passes the full conversation history so the agent has context for follow-up rounds
    const aiResponse = await advisoryAgent.processMessage(finalMessage, conversation);

    // ── Save AI response to conversation ──────────────────────────────────────
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse.content,
      advisory: aiResponse.advisory || null // null for follow-up questions, object for final diagnosis
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

/**
 * getConversations — List all conversations for the authenticated user.
 *
 * Returns a summary view (no full message content) sorted by most recently updated.
 * Limited to 20 conversations to keep response size manageable.
 *
 * @returns {200} { conversations: [{ _id, title, messageCount, lastMessage, updatedAt }] }
 */
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user._id })
      .sort({ updatedAt: -1 }) // most recent first
      .limit(20)
      .select('_id title updatedAt messages');

    res.json({
      conversations: conversations.map(c => ({
        _id: c._id,
        title: c.title,
        messageCount: c.messages.length,
        // Show a preview of the last message (truncated to 60 chars)
        lastMessage: c.messages.length > 0 ? c.messages[c.messages.length - 1].content.substring(0, 60) : '',
        updatedAt: c.updatedAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * getConversation — Fetch a single conversation with its full message history.
 *
 * The userId check ensures users can only access their own conversations.
 *
 * @param {string} req.params.id - Conversation ObjectId
 * @returns {200} { conversation } — full document including all messages
 * @returns {404} If not found or belongs to a different user
 */
export const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.user._id });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ conversation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * deleteConversation — Permanently delete a conversation and all its messages.
 *
 * Uses findOneAndDelete with userId to prevent deleting another user's conversation.
 *
 * @param {string} req.params.id - Conversation ObjectId
 * @returns {200} { message: 'Conversation deleted successfully' }
 * @returns {404} If not found or belongs to a different user
 */
export const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ message: 'Conversation deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
