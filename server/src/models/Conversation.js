import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    advisory: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    messages: [messageSchema]
  },
  { timestamps: true }
);

export const Conversation = mongoose.model('Conversation', conversationSchema);
