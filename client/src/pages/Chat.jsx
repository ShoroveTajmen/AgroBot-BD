import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

// ── Helpers ──
function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function Advisory({ advisory }) {
  if (!advisory?.likelyDisease) return null;
  return (
    <div className="mt-3 p-3 bg-[#e8f5e9] rounded-xl border-l-4 border-[#2d6a2d] text-sm">
      <h4 className="font-bold text-[#1a4d1a] mb-1">📋 {advisory.likelyDisease}</h4>
      <p className="text-gray-600 text-xs mb-2">
        <strong>Confidence:</strong> {advisory.confidence || 'Medium'} &nbsp;|&nbsp;
        <strong>Cause:</strong> {advisory.causeType || 'Unknown'}
      </p>
      {advisory.recommendedActions?.length > 0 && (
        <ul className="list-disc ml-4 text-gray-700 text-xs space-y-0.5">
          {advisory.recommendedActions.map((a, i) => <li key={i}>{a}</li>)}
        </ul>
      )}
      {advisory.escalateToAgronomist && (
        <div className="mt-2 p-2 bg-orange-50 border-l-4 border-orange-400 text-orange-700 text-xs rounded">
          ⚠️ Please consult an agronomist immediately.
        </div>
      )}
    </div>
  );
}

function BotMessage({ content, advisory }) {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#c8e6c9] flex-shrink-0">
        <img src="/agro_icon.png" alt="bot" className="w-full h-full object-cover" />
      </div>
      <div className="max-w-[74%]">
        <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm text-sm text-gray-800 leading-relaxed">
          <span dangerouslySetInnerHTML={{ __html: formatText(content) }} />
          <Advisory advisory={advisory} />
        </div>
      </div>
    </div>
  );
}

function UserMessage({ content }) {
  return (
    <div className="flex items-end justify-end mb-4">
      <div className="max-w-[74%]">
        <div className="bg-[#1a4d1a] text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#c8e6c9] flex-shrink-0">
        <img src="/agro_icon.png" alt="bot" className="w-full h-full object-cover" />
      </div>
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const bottomRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const res = await api.get('/conversations');
      setConversations(res.data.conversations);
      
      // Load the most recent conversation if exists
      if (res.data.conversations.length > 0 && !conversationId) {
        const latest = res.data.conversations[0];
        loadConversation(latest._id);
      } else if (res.data.conversations.length === 0) {
        // Show welcome message for new users
        setMessages([{
          role: 'bot',
          content: 'Assalamu Alaikum! I am AgroBot. How can I help with your crops today?\nYou can ask me about weather, pest control, or describe your crop problem.',
          advisory: null
        }]);
      }
    } catch (e) {
      console.warn('Failed to load conversations:', e.message);
    }
  }

  async function loadConversation(convId) {
    try {
      setConversationId(convId);
      const res = await api.get(`/conversations/${convId}`);
      const msgs = res.data.conversation.messages;
      
      if (msgs.length > 0) {
        setMessages(msgs.map(m => ({
          role: m.role === 'assistant' ? 'bot' : 'user',
          content: m.content,
          advisory: m.advisory || null
        })));
      } else {
        setMessages([]);
      }
    } catch (e) {
      console.error('Failed to load conversation:', e.message);
    }
  }

  function startNewChat() {
    setConversationId(null);
    setMessages([{
      role: 'bot',
      content: 'Assalamu Alaikum! I am AgroBot. How can I help with your crops today?',
      advisory: null
    }]);
    setShowSidebar(false);
  }

  async function deleteChat(convId, e) {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    
    try {
      await api.delete(`/conversations/${convId}`);
      
      // Reload conversations
      await loadConversations();
      
      // If deleted current conversation, start new chat
      if (convId === conversationId) {
        startNewChat();
      }
    } catch (e) {
      console.error('Failed to delete conversation:', e.message);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text, advisory: null }]);
    setTyping(true);
    setLoading(true);

    try {
      const res = await api.post('/chat', { conversationId, message: text });
      if (res.data.conversationId) {
        setConversationId(res.data.conversationId);
        // Reload conversations to update the list
        loadConversations();
      }
      setMessages(prev => [...prev, {
        role: 'bot',
        content: res.data.response.content,
        advisory: res.data.response.advisory
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: `Sorry, something went wrong: ${err.response?.data?.error || err.message}`,
        advisory: null
      }]);
    } finally {
      setTyping(false);
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigate('/signin');
  }

  return (
    <div className="flex flex-col h-screen bg-[#f0f7f0] overflow-hidden">

      {/* ── Sidebar ── */}
      {showSidebar && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowSidebar(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1a4d1a]">Conversation History</h2>
                <button onClick={() => setShowSidebar(false)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">Your recent farm assistant chats</p>
              <button
                onClick={startNewChat}
                className="w-full bg-[#1a4d1a] text-white rounded-lg px-4 py-3 font-semibold hover:bg-[#2d6a2d] transition flex items-center justify-center gap-2"
              >
                <span className="text-lg">💬</span>
                Start New Consult
              </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-2">
              {conversations.length === 0 ? (
                <div className="text-center text-gray-400 mt-8 text-sm">No conversations yet</div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv._id}
                    onClick={() => { loadConversation(conv._id); setShowSidebar(false); }}
                    className={`p-3 mb-2 rounded-lg cursor-pointer transition ${
                      conv._id === conversationId
                        ? 'bg-[#e8f5e9] border-l-4 border-[#1a4d1a]'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-800 truncate">{conv.title}</div>
                        <div className="text-xs text-gray-500 truncate mt-1">{conv.lastMessage}</div>
                        <div className="text-xs text-gray-400 mt-1">{formatDate(conv.updatedAt)}</div>
                      </div>
                      <button
                        onClick={(e) => deleteChat(conv._id, e)}
                        className="text-gray-400 hover:text-red-500 text-sm flex-shrink-0"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 shadow-sm z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition"
          >
            {showSidebar ? (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <img src="/agro_icon.png" alt="AgroBot BD" className="w-8 h-8 rounded-full" />
          <span className="font-bold text-[#1a4d1a] text-base">AgroBot BD</span>
        </div>
        <div className="flex items-center gap-2 relative">
          <button className="w-9 h-9 rounded-full bg-[#e8f5e9] flex items-center justify-center text-base hover:bg-[#c8e6c9] transition">
            🔔
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
            className="w-9 h-9 rounded-full bg-[#e8f5e9] flex items-center justify-center overflow-hidden border-[3px] border-[#1a4d1a] hover:bg-[#c8e6c9] transition"
          >
            <img src="/user_icon.png" alt="profile" className="w-full h-full object-cover rounded-full" />
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div
              className="absolute top-11 right-0 bg-white rounded-xl shadow-xl p-4 min-w-[200px] z-50"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#e8f5e9] border-[2.5px] border-[#1a4d1a] overflow-hidden">
                  <img src="/user_icon.png" alt="avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-800">{user.name || 'User'}</div>
                  <div className="text-xs text-gray-400">{user.email || ''}</div>
                </div>
              </div>
              <hr className="my-2 border-gray-100" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 17l5-5-5-5" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12H9" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
                  <rect x="8" y="10.5" width="2.5" height="3" rx="1" fill="#dc2626"/>
                </svg>
                <span className="font-semibold">Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
      )}

      {/* ── Messages ── */}
      <main className="flex-1 overflow-y-auto pt-16 pb-48 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center my-4">
            <span className="text-xs font-semibold tracking-widest text-gray-400 bg-gray-200 rounded-full px-4 py-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          {messages.map((msg, i) =>
            msg.role === 'bot'
              ? <BotMessage key={i} content={msg.content} advisory={msg.advisory} />
              : <UserMessage key={i} content={msg.content} />
          )}

          {typing && <TypingIndicator />}
          <div ref={bottomRef} className="h-8" />
        </div>
      </main>

      {/* ── Input bar ── */}
      <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-[#f0f7f0]">
        <div className="max-w-2xl mx-auto">
          {/* Quick suggestion buttons */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            <button
              onClick={() => setInput('How to control pests in rice?')}
              className="px-4 py-2 rounded-full bg-[#a8d5a8] text-[#1a4d1a] text-sm font-medium whitespace-nowrap hover:bg-[#8fc98f] transition"
            >
              How to control pests in rice?
            </button>
            <button
              onClick={() => setInput('Best fertilizer for Rice?')}
              className="px-4 py-2 rounded-full bg-white text-gray-600 text-sm font-medium whitespace-nowrap border border-gray-300 hover:bg-gray-50 transition"
            >
              Best fertilizer for Rice?
            </button>
            <button
              onClick={() => setInput("Today's Weather")}
              className="px-4 py-2 rounded-full bg-white text-gray-600 text-sm font-medium whitespace-nowrap border border-gray-300 hover:bg-gray-50 transition"
            >
              Today's Weather
            </button>
          </div>

          {/* Input field */}
          <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-md">
            <button className="flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="18" height="13" rx="2" fill="#a8d5a8" stroke="#1a4d1a" strokeWidth="2"/>
                <circle cx="12" cy="12.5" r="3.5" fill="#e8f5e9" stroke="#1a4d1a" strokeWidth="1.5"/>
                <circle cx="12" cy="12.5" r="2" fill="#2d6a2d"/>
                <circle cx="17" cy="9" r="1" fill="#1a4d1a"/>
                <path d="M3 8h3l1-2h10l1 2h3" stroke="#1a4d1a" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
              placeholder="Type your question..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="w-10 h-10 rounded-full bg-[#1a4d1a] text-white flex items-center justify-center flex-shrink-0 hover:bg-[#2d6a2d] transition disabled:bg-gray-400"
            >
              ➤
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-sm flex">
        <button
          onClick={() => setShowSidebar(true)}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-xs transition text-[#1a4d1a]"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          Chat
        </button>
        {[
          { icon: '🌾', label: 'Crops' },
          { icon: '☀️', label: 'Weather' },
          { icon: 'community', label: 'Community' },
        ].map(({ icon, label }) => (
          <button key={label}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-xs transition text-gray-400 hover:text-gray-600">
            {icon === 'community' ? (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="7" r="3" fill="#4ade80"/>
                <circle cx="15" cy="7" r="3" fill="#2d6a2d"/>
                <ellipse cx="9" cy="16" rx="5" ry="3.5" fill="#86efac"/>
                <ellipse cx="15" cy="16" rx="5" ry="3.5" fill="#a8d5a8"/>
              </svg>
            ) : (
              <span className="text-xl">{icon}</span>
            )}
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
