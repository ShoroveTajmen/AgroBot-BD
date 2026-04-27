# Testing the Conversation History Feature

## Prerequisites
- MongoDB running
- Server running on port 5000
- Client running on port 5173 (or configured port)
- User account created and logged in

## Testing Steps

### 1. Start the Application

**Terminal 1 - Start Server:**
```bash
cd agrobot-bd/server
npm start
```

**Terminal 2 - Start Client:**
```bash
cd agrobot-bd/client
npm run dev
```

### 2. Test Basic Conversation Flow

1. **Login** to your account
2. You should see the chat interface with a welcome message
3. **Send a message** (e.g., "What crops grow well in Bangladesh?")
4. The conversation is automatically created with a title based on your first message

### 3. Test Sidebar Access

**Method 1: Hamburger Menu**
- Click the hamburger menu icon (☰) in the top-left of the header
- Sidebar should slide in from the left

**Method 2: Chat Icon**
- Click the Chat icon in the bottom navigation bar
- Sidebar should open

### 4. Test Multiple Conversations

1. **Start a new conversation:**
   - Open the sidebar
   - Click "Start New Consult" button
   - Send a different message (e.g., "Tell me about rice diseases")

2. **Verify conversation list:**
   - Open sidebar again
   - You should see 2 conversations listed
   - Each shows: title, last message preview, and timestamp

3. **Switch between conversations:**
   - Click on the first conversation in the list
   - Messages from that conversation should load
   - Click on the second conversation
   - Messages should switch to the second conversation

### 5. Test Conversation Deletion

1. Open the sidebar
2. Hover over a conversation item
3. Click the trash icon (🗑️) on the right
4. Confirm the deletion in the popup
5. Conversation should be removed from the list
6. If you deleted the active conversation, a new chat should start

### 6. Test Conversation Persistence

1. Create a few conversations
2. Refresh the page (F5)
3. The most recent conversation should load automatically
4. Open sidebar to verify all conversations are still there

### 7. Test UI Elements

**Sidebar Features:**
- ✅ Overlay backdrop (click outside to close)
- ✅ Close button (✕) in top-right
- ✅ Active conversation highlighted in green
- ✅ Timestamps formatted correctly (e.g., "2m ago", "3h ago")
- ✅ Long titles truncated with ellipsis
- ✅ Smooth animations

**Header:**
- ✅ Hamburger menu button visible
- ✅ Opens sidebar on click

**Bottom Navigation:**
- ✅ Chat icon highlighted in green
- ✅ Opens sidebar on click

### 8. Test Edge Cases

**Empty State:**
1. Delete all conversations
2. Sidebar should show "No conversations yet"
3. Main chat should show welcome message

**Long Titles:**
1. Send a very long first message (>50 characters)
2. Check sidebar - title should be truncated to 47 chars + "..."

**Multiple Users:**
1. Logout and create a new account
2. Login with new account
3. Should see empty conversation list (no access to other users' chats)

## Expected Behavior

### Conversation List Display:
```
┌─────────────────────────────────────┐
│ Conversation History            [✕] │
│ Your recent farm assistant chats    │
│                                     │
│ [💬 Start New Consult]              │
├─────────────────────────────────────┤
│ ┌─────────────────────────────┐    │
│ │ What crops grow well in...  │🗑️ │
│ │ Rice, jute, and wheat are...│    │
│ │ 2h ago                       │    │
│ └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ Tell me about rice diseases │🗑️ │
│ │ Brown spot is a common...   │    │
│ │ Just now                     │    │
│ └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

## API Testing (Optional)

Use Postman or curl to test the backend directly:

### Get All Conversations:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/conversations
```

### Get Specific Conversation:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/conversations/CONVERSATION_ID
```

### Delete Conversation:
```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/conversations/CONVERSATION_ID
```

### Send Message:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello AgroBot", "conversationId": "CONVERSATION_ID"}' \
  http://localhost:5000/api/chat
```

## Troubleshooting

### Sidebar not opening:
- Check browser console for errors
- Verify `showSidebar` state is updating
- Check z-index conflicts

### Conversations not loading:
- Verify MongoDB is running
- Check server logs for errors
- Verify authentication token is valid

### Delete not working:
- Check if confirmation dialog appears
- Verify DELETE endpoint is registered
- Check server logs for authorization errors

### Timestamps showing wrong format:
- Check system time is correct
- Verify `formatDate()` function logic
- Check conversation `updatedAt` field in database

## Success Criteria

✅ Users can create multiple conversations
✅ Conversations are saved to database
✅ Users can switch between conversations
✅ Users can delete conversations
✅ Sidebar opens from hamburger menu and chat icon
✅ Active conversation is highlighted
✅ Timestamps are formatted correctly
✅ Conversation titles are auto-generated
✅ All conversations are linked to the logged-in user
✅ UI is responsive and smooth
