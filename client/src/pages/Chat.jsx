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
  const [conversationId, setConversationId] = useState(
    localStorage.getItem('agrobot_conversationId') || null
  );
  const bottomRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Load chat history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const res = await api.get('/conversations');
      const convs = res.data.conversations;
      if (convs.length > 0) {
        const latest = convs[0];
        setConversationId(latest._id);
        localStorage.setItem('agrobot_conversationId', latest._id);

        const full = await api.get(`/conversations/${latest._id}`);
        const msgs = full.data.conversation.messages;
        if (msgs.length > 0) {
          setMessages(msgs.map(m => ({
            role: m.role === 'assistant' ? 'bot' : 'user',
            content: m.content,
            advisory: m.advisory || null
          })));
          return;
        }
      }
    } catch (e) {
      console.warn('History load failed:', e.message);
    }
    // Welcome message for new users
    setMessages([{
      role: 'bot',
      content: 'Assalamu Alaikum! I am AgroBot. How can I help with your crops today?\nYou can ask me about weather, pest control, or describe your crop problem.',
      advisory: null
    }]);
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
        localStorage.setItem('agrobot_conversationId', res.data.conversationId);
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
    localStorage.removeItem('agrobot_conversationId');
    navigate('/signin');
  }

  return (
    <div className="flex flex-col h-screen bg-[#f0f7f0] overflow-hidden">

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 shadow-sm z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src="/agro_icon.png" alt="AgroBot BD" className="w-8 h-8 rounded-full" />
          <span className="font-bold text-[#1a4d1a] text-base">AgroBot BD</span>
        </div>
        <div className="flex items-center gap-2 relative">
          <button className="w-9 h-9 rounded-full bg-[#e8f5e9] flex items-center justify-center text-base hover:bg-[#c8e6c9] transition">
            🔔
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
            className="w-9 h-9 rounded-full bg-[#e8f5e9] flex items-center justify-center overflow-hidden border-[3px] border-[#2d6a2d] hover:bg-[#c8e6c9] transition"
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
                <div className="w-10 h-10 rounded-full bg-[#e8f5e9] border-2 border-green-400 overflow-hidden">
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
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                🚪 Logout
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
      <main className="flex-1 overflow-y-auto pt-16 pb-32 px-4">
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
          <div ref={bottomRef} />
        </div>
      </main>

      {/* ── Input bar ── */}
      <div className="fixed bottom-16 left-0 right-0 px-4 py-2 bg-[#f0f7f0]">
        <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-md max-w-2xl mx-auto">
          <button className="text-gray-400 text-xl flex-shrink-0">📷</button>
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

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-sm flex">
        {[
          { icon: 'chat', label: 'Chat', active: true },
          { icon: '🌾', label: 'Crops' },
          { icon: '☀️', label: 'Weather' },
          { icon: 'community', label: 'Community' },
        ].map(({ icon, label, active }) => (
          <button key={label}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs transition
              ${active ? 'text-[#1a4d1a]' : 'text-gray-400 hover:text-gray-600'}`}>
            {icon === 'chat' ? (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            ) : icon === 'community' ? (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
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
