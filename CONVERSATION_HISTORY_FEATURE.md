# Conversation History Feature Implementation

## Overview
This document describes the implementation of the conversation history feature that allows users to manage multiple chat conversations with AgroBot.

## Features Implemented

### 1. **Sidebar with Conversation History**
- Displays all previous conversations for the logged-in user
- Shows conversation title, last message preview, and timestamp
- Allows users to switch between conversations
- Includes a "Start New Consult" button
- Delete functionality for individual conversations

### 2. **Multiple Conversation Management**
- Users can have multiple independent chat sessions
- Each conversation is stored separately in the database
- Conversations are linked to the authenticated user
- Auto-generated titles based on the first message

### 3. **UI Enhancements**
- Hamburger menu in header to open sidebar
- Chat icon in bottom navigation opens sidebar
- Smooth transitions and animations
- Responsive design with overlay backdrop
- Active conversation highlighting

## Backend Changes

### Modified Files:

#### 1. `server/src/models/Conversation.js`
- Added `title` field to conversation schema
- Default value: "New Chat"

#### 2. `server/src/controllers/chatController.js`
- **Updated `chat` function**: Auto-generates conversation title from first message (truncated to 50 chars)
- **Updated `getConversations` function**: Returns title, lastMessage preview, and messageCount
- **Added `deleteConversation` function**: Allows users to delete their conversations

#### 3. `server/src/routes/api.js`
- Added DELETE endpoint: `/api/conversations/:id`

### New API Endpoints:
```
DELETE /api/conversations/:id - Delete a specific conversation
```

### Existing Endpoints (Enhanced):
```
GET /api/conversations - List all user conversations (now includes title and preview)
GET /api/conversations/:id - Get full conversation details
POST /api/chat - Send message (auto-creates conversation with title)
```

## Frontend Changes

### Modified Files:

#### 1. `client/src/pages/Chat.jsx`

**New State Variables:**
- `showSidebar` - Controls sidebar visibility
- `conversations` - Array of user's conversations
- `conversationId` - Currently active conversation ID

**New Functions:**
- `formatDate()` - Formats timestamps (e.g., "2m ago", "3h ago")
- `loadConversations()` - Fetches all user conversations
- `loadConversation(convId)` - Loads a specific conversation
- `startNewChat()` - Starts a fresh conversation
- `deleteChat(convId, e)` - Deletes a conversation with confirmation

**UI Components Added:**
- Sidebar with conversation list
- Hamburger menu button in header
- Overlay backdrop for sidebar
- Delete button for each conversation
- "Start New Consult" button

**Updated Components:**
- Header: Added hamburger menu button
- Bottom Navigation: Chat icon now opens sidebar
- Input bar: Retained quick suggestion buttons

## User Flow

1. **First Time User:**
   - Sees welcome message
   - Starts chatting
   - First message creates a new conversation with auto-generated title

2. **Returning User:**
   - Most recent conversation loads automatically
   - Can click hamburger menu or chat icon to view all conversations
   - Can switch between conversations
   - Can start new conversations
   - Can delete old conversations

3. **Conversation Management:**
   - Click any conversation in sidebar to load it
   - Click "Start New Consult" to begin fresh chat
   - Click trash icon to delete (with confirmation)
   - Active conversation is highlighted in green

## Database Schema

### Conversation Model:
```javascript
{
  userId: ObjectId (ref: User),
  title: String (default: "New Chat"),
  messages: [
    {
      role: String (enum: ['user', 'assistant']),
      content: String,
      advisory: Mixed,
      timestamps: true
    }
  ],
  timestamps: true
}
```

## Security
- All conversation endpoints require authentication
- Users can only access their own conversations
- Conversation ownership verified on all operations (read, delete)

## Future Enhancements
- Search conversations
- Edit conversation titles
- Archive conversations
- Export conversation history
- Conversation categories/tags
- Share conversations with agronomists
