/**
 * ============================================================
 *  UNIT TESTS — chatController
 *
 *  Tests HTTP-level behaviour of chat, getConversations,
 *  getConversation, and deleteConversation.
 *  All external dependencies (DB, AI agent, image tool) are mocked.
 * ============================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock dependencies ─────────────────────────────────────────────────────────
vi.mock('../../../agents/advisoryAgent.js', () => ({
  advisoryAgent: { processMessage: vi.fn() },
}));

vi.mock('../../../tools/imageTool.js', () => ({
  imageTool: { analyzeCropImage: vi.fn() },
}));

vi.mock('../../../models/Conversation.js', () => ({
  Conversation: {
    findOne:         vi.fn(),
    create:          vi.fn(),
    find:            vi.fn(),
    findOneAndDelete: vi.fn(),
  },
}));

import { chat, getConversations, getConversation, deleteConversation }
  from '../../../controllers/chatController.js';
import { advisoryAgent } from '../../../agents/advisoryAgent.js';
import { imageTool }     from '../../../tools/imageTool.js';
import { Conversation }  from '../../../models/Conversation.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────
function makeRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json   = vi.fn().mockReturnValue(res);
  return res;
}

function makeConversation(overrides = {}) {
  const conv = {
    _id:      'conv-id-123',
    userId:   'user-id-123',
    title:    'Test Chat',
    messages: [],
    save:     vi.fn().mockResolvedValue(true),
    ...overrides,
  };
  // messages.push must work
  conv.messages.push = Array.prototype.push.bind(conv.messages);
  return conv;
}

const MOCK_USER = { _id: 'user-id-123' };
const AI_RESPONSE = { content: 'Your rice has Brown Spot disease.', advisory: { likelyDisease: 'Brown Spot' } };

// ─────────────────────────────────────────────────────────────────────────────
//  chat
// ─────────────────────────────────────────────────────────────────────────────
describe('chatController › chat', () => {

  beforeEach(() => vi.clearAllMocks());

  // ── Input validation ─────────────────────────────────────────────────────────
  describe('input validation', () => {
    it('✅ returns 400 when neither message nor image is provided', async () => {
      const req = { body: {}, user: MOCK_USER };
      const res = makeRes();
      await chat(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
  });

  // ── New conversation ─────────────────────────────────────────────────────────
  describe('new conversation (no conversationId)', () => {
    it('✅ creates a new conversation when no conversationId is given', async () => {
      const conv = makeConversation();
      Conversation.create.mockResolvedValue(conv);
      advisoryAgent.processMessage.mockResolvedValue(AI_RESPONSE);

      const req = { body: { message: 'My rice has spots' }, user: MOCK_USER };
      const res = makeRes();
      await chat(req, res);

      expect(Conversation.create).toHaveBeenCalledOnce();
    });

    it('✅ uses first 50 chars of message as conversation title', async () => {
      const conv = makeConversation();
      Conversation.create.mockResolvedValue(conv);
      advisoryAgent.processMessage.mockResolvedValue(AI_RESPONSE);

      const longMsg = 'A'.repeat(60);
      const req = { body: { message: longMsg }, user: MOCK_USER };
      await chat(req, makeRes());

      const createCall = Conversation.create.mock.calls[0][0];
      expect(createCall.title).toHaveLength(50); // 47 + '...'
    });

    it('✅ uses image title when no text message is provided', async () => {
      const conv = makeConversation();
      Conversation.create.mockResolvedValue(conv);
      imageTool.analyzeCropImage.mockResolvedValue({
        cropDetected: 'Rice', symptomsObserved: ['spots'], likelyCondition: 'Brown Spot', severity: 'moderate',
      });
      advisoryAgent.processMessage.mockResolvedValue(AI_RESPONSE);

      const req = { body: { image: 'base64data', imageMimeType: 'image/jpeg' }, user: MOCK_USER };
      await chat(req, makeRes());

      const createCall = Conversation.create.mock.calls[0][0];
      expect(createCall.title).toContain('📷');
    });
  });

  // ── Existing conversation ────────────────────────────────────────────────────
  describe('existing conversation', () => {
    it('✅ loads existing conversation when conversationId is provided', async () => {
      const conv = makeConversation();
      Conversation.findOne.mockResolvedValue(conv);
      advisoryAgent.processMessage.mockResolvedValue(AI_RESPONSE);

      const req = { body: { conversationId: 'conv-id-123', message: 'More info' }, user: MOCK_USER };
      await chat(req, makeRes());

      expect(Conversation.findOne).toHaveBeenCalledWith({ _id: 'conv-id-123', userId: MOCK_USER._id });
    });

    it('✅ returns 404 when conversation is not found', async () => {
      Conversation.findOne.mockResolvedValue(null);

      const req = { body: { conversationId: 'bad-id', message: 'Hello' }, user: MOCK_USER };
      const res = makeRes();
      await chat(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ── Success response ─────────────────────────────────────────────────────────
  describe('success response', () => {
    it('✅ returns conversationId and response in the JSON body', async () => {
      const conv = makeConversation();
      Conversation.create.mockResolvedValue(conv);
      advisoryAgent.processMessage.mockResolvedValue(AI_RESPONSE);

      const req = { body: { message: 'My rice has spots' }, user: MOCK_USER };
      const res = makeRes();
      await chat(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        conversationId: conv._id,
        response: expect.objectContaining({ content: AI_RESPONSE.content }),
      }));
    });

    it('✅ saves the conversation after getting AI response', async () => {
      const conv = makeConversation();
      Conversation.create.mockResolvedValue(conv);
      advisoryAgent.processMessage.mockResolvedValue(AI_RESPONSE);

      const req = { body: { message: 'My rice has spots' }, user: MOCK_USER };
      await chat(req, makeRes());

      expect(conv.save).toHaveBeenCalledOnce();
    });

    it('✅ adds user message and AI response to conversation.messages', async () => {
      const conv = makeConversation();
      Conversation.create.mockResolvedValue(conv);
      advisoryAgent.processMessage.mockResolvedValue(AI_RESPONSE);

      const req = { body: { message: 'My rice has spots' }, user: MOCK_USER };
      await chat(req, makeRes());

      expect(conv.messages.length).toBe(2);
      expect(conv.messages[0].role).toBe('user');
      expect(conv.messages[1].role).toBe('assistant');
    });
  });

  // ── Image handling ───────────────────────────────────────────────────────────
  describe('image handling', () => {
    it('✅ calls imageTool.analyzeCropImage when image is provided', async () => {
      const conv = makeConversation();
      Conversation.create.mockResolvedValue(conv);
      imageTool.analyzeCropImage.mockResolvedValue({
        cropDetected: 'Rice', symptomsObserved: ['brown spots'],
        likelyCondition: 'Brown Spot', severity: 'moderate',
      });
      advisoryAgent.processMessage.mockResolvedValue(AI_RESPONSE);

      const req = { body: { image: 'base64data', imageMimeType: 'image/jpeg' }, user: MOCK_USER };
      await chat(req, makeRes());

      expect(imageTool.analyzeCropImage).toHaveBeenCalledWith('base64data', 'image/jpeg');
    });

    it('✅ continues with fallback message when image analysis fails', async () => {
      const conv = makeConversation();
      Conversation.create.mockResolvedValue(conv);
      imageTool.analyzeCropImage.mockRejectedValue(new Error('Vision API error'));
      advisoryAgent.processMessage.mockResolvedValue(AI_RESPONSE);

      const req = { body: { image: 'base64data' }, user: MOCK_USER };
      const res = makeRes();
      await chat(req, res);

      // Should still respond, not crash
      expect(res.json).toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  getConversations
// ─────────────────────────────────────────────────────────────────────────────
describe('chatController › getConversations', () => {

  beforeEach(() => vi.clearAllMocks());

  it('✅ returns a conversations array', async () => {
    const mockConvs = [
      { _id: 'c1', title: 'Chat 1', updatedAt: new Date(), messages: [{ content: 'Hello' }] },
      { _id: 'c2', title: 'Chat 2', updatedAt: new Date(), messages: [] },
    ];
    Conversation.find.mockReturnValue({
      sort:   vi.fn().mockReturnThis(),
      limit:  vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue(mockConvs),
    });

    const req = { user: MOCK_USER };
    const res = makeRes();
    await getConversations(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      conversations: expect.any(Array),
    }));
  });

  it('✅ each conversation has _id, title, messageCount, lastMessage, updatedAt', async () => {
    const mockConvs = [
      { _id: 'c1', title: 'Chat 1', updatedAt: new Date(), messages: [{ content: 'Hello world' }] },
    ];
    Conversation.find.mockReturnValue({
      sort:   vi.fn().mockReturnThis(),
      limit:  vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue(mockConvs),
    });

    const req = { user: MOCK_USER };
    const res = makeRes();
    await getConversations(req, res);

    const { conversations } = res.json.mock.calls[0][0];
    expect(conversations[0]).toHaveProperty('_id');
    expect(conversations[0]).toHaveProperty('title');
    expect(conversations[0]).toHaveProperty('messageCount');
    expect(conversations[0]).toHaveProperty('lastMessage');
    expect(conversations[0]).toHaveProperty('updatedAt');
  });

  it('✅ messageCount is 0 for empty conversations', async () => {
    const mockConvs = [{ _id: 'c1', title: 'Empty', updatedAt: new Date(), messages: [] }];
    Conversation.find.mockReturnValue({
      sort:   vi.fn().mockReturnThis(),
      limit:  vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue(mockConvs),
    });

    const req = { user: MOCK_USER };
    const res = makeRes();
    await getConversations(req, res);

    const { conversations } = res.json.mock.calls[0][0];
    expect(conversations[0].messageCount).toBe(0);
    expect(conversations[0].lastMessage).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  getConversation
// ─────────────────────────────────────────────────────────────────────────────
describe('chatController › getConversation', () => {

  beforeEach(() => vi.clearAllMocks());

  it('✅ returns the conversation when found', async () => {
    const conv = makeConversation();
    Conversation.findOne.mockResolvedValue(conv);

    const req = { params: { id: 'conv-id-123' }, user: MOCK_USER };
    const res = makeRes();
    await getConversation(req, res);

    expect(res.json).toHaveBeenCalledWith({ conversation: conv });
  });

  it('✅ returns 404 when conversation is not found', async () => {
    Conversation.findOne.mockResolvedValue(null);

    const req = { params: { id: 'bad-id' }, user: MOCK_USER };
    const res = makeRes();
    await getConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  deleteConversation
// ─────────────────────────────────────────────────────────────────────────────
describe('chatController › deleteConversation', () => {

  beforeEach(() => vi.clearAllMocks());

  it('✅ returns success message when conversation is deleted', async () => {
    Conversation.findOneAndDelete.mockResolvedValue(makeConversation());

    const req = { params: { id: 'conv-id-123' }, user: MOCK_USER };
    const res = makeRes();
    await deleteConversation(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  it('✅ returns 404 when conversation to delete is not found', async () => {
    Conversation.findOneAndDelete.mockResolvedValue(null);

    const req = { params: { id: 'bad-id' }, user: MOCK_USER };
    const res = makeRes();
    await deleteConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('✅ calls findOneAndDelete with correct id and userId', async () => {
    Conversation.findOneAndDelete.mockResolvedValue(makeConversation());

    const req = { params: { id: 'conv-id-123' }, user: MOCK_USER };
    await deleteConversation(req, makeRes());

    expect(Conversation.findOneAndDelete).toHaveBeenCalledWith({
      _id: 'conv-id-123', userId: MOCK_USER._id,
    });
  });
});
