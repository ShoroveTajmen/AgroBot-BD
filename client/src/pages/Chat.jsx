import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import ThemeToggle from '../components/ThemeToggle.jsx';

function formatText(text) {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br/>');
}

function formatDate(dateString) {
  const date = new Date(dateString), now = new Date(), diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000), diffHours = Math.floor(diffMs / 3600000), diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function Advisory({ advisory }) {
  if (!advisory?.likelyDisease) return null;
  return (
    <div className="mt-3 p-3 bg-[#e8f5e9] dark:bg-gray-700 rounded-xl border-l-4 border-[#2d6a2d] dark:border-green-500 text-sm transition-colors">
      <h4 className="font-bold text-[#1a4d1a] dark:text-green-400 mb-1">📋 {advisory.likelyDisease}</h4>
      <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
        <strong>Confidence:</strong> {advisory.confidence || 'Medium'} &nbsp;|&nbsp;
        <strong>Cause:</strong> {advisory.causeType || 'Unknown'}
      </p>
      {advisory.recommendedActions?.length > 0 && (
        <ul className="list-disc ml-4 text-gray-700 dark:text-gray-300 text-xs space-y-0.5">
          {advisory.recommendedActions.map((a, i) => <li key={i}>{a}</li>)}
        </ul>
      )}
      {advisory.escalateToAgronomist && (
        <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-400 text-orange-700 dark:text-orange-300 text-xs rounded">
          ⚠️ Please consult an agronomist immediately.
        </div>
      )}
    </div>
  );
}

function BotMessage({ content, advisory }) {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-[#c8e6c9] dark:border-green-700 flex-shrink-0">
        <img src="/agro_icon.png" alt="bot" className="w-full h-full object-cover" />
      </div>
      <div className="max-w-[85%] sm:max-w-[74%]">
        <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-sm px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm text-sm text-gray-800 dark:text-gray-200 leading-relaxed transition-colors">
          <span dangerouslySetInnerHTML={{ __html: formatText(content) }} />
          <Advisory advisory={advisory} />
        </div>
      </div>
    </div>
  );
}

function UserMessage({ content, imagePreview }) {
  return (
    <div className="flex items-end justify-end mb-4">
      <div className="max-w-[85%] sm:max-w-[74%]">
        {imagePreview && (
          <div className="mb-1 flex justify-end">
            <img src={imagePreview} alt="uploaded crop" className="max-w-[160px] sm:max-w-[200px] max-h-[120px] sm:max-h-[150px] rounded-xl object-cover shadow-md border-2 border-[#1a4d1a] dark:border-green-600" />
          </div>
        )}
        <div className="bg-[#1a4d1a] dark:bg-green-700 text-white rounded-2xl rounded-br-sm px-3 sm:px-4 py-2.5 sm:py-3 text-sm leading-relaxed transition-colors">
          {content}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-[#c8e6c9] dark:border-green-700 flex-shrink-0">
        <img src="/agro_icon.png" alt="bot" className="w-full h-full object-cover" />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm transition-colors">
        <div className="flex gap-1 items-center">
          <div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div>
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
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMimeType, setImageMimeType] = useState(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);
  useEffect(() => { loadConversations(); }, []);

  async function loadConversations() {
    try {
      const res = await api.get('/conversations');
      setConversations(res.data.conversations);
      if (res.data.conversations.length > 0 && !conversationId) {
        loadConversation(res.data.conversations[0]._id);
      } else if (res.data.conversations.length === 0) {
        setMessages([{ role: 'bot', content: 'Assalamu Alaikum! I am AgroBot. How can I help with your crops today?\nYou can ask me about weather, pest control, or describe your crop problem.', advisory: null }]);
      }
    } catch (e) { console.warn('Failed to load conversations:', e.message); }
  }

  async function loadConversation(convId) {
    try {
      setConversationId(convId);
      const res = await api.get(`/conversations/${convId}`);
      const msgs = res.data.conversation.messages;
      if (msgs.length > 0) {
        setMessages(msgs.map(m => ({ role: m.role === 'assistant' ? 'bot' : 'user', content: m.content, advisory: m.advisory || null })));
      } else { setMessages([]); }
    } catch (e) { console.error('Failed to load conversation:', e.message); }
  }

  function startNewChat() {
    setConversationId(null);
    setMessages([{ role: 'bot', content: 'Hello! I am AgroBot 🌾. Your AI farming assistant. How can I help with your crops today?', advisory: null }]);
    setShowSidebar(false);
  }

  async function deleteChat(convId, e) {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      await api.delete(`/conversations/${convId}`);
      await loadConversations();
      if (convId === conversationId) startNewChat();
    } catch (e) { console.error('Failed to delete conversation:', e.message); }
  }

  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    setImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setImagePreview(dataUrl);
      // Extract base64 part only (remove "data:image/jpeg;base64," prefix)
      setImageBase64(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImagePreview(null);
    setImageBase64(null);
    setImageMimeType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text && !imageBase64 || loading) return;

    setInput('');
    const userDisplayContent = text || '📷 Sent a crop photo for analysis';
    setMessages(prev => [...prev, {
      role: 'user',
      content: userDisplayContent,
      imagePreview: imagePreview,
      advisory: null
    }]);

    const imgBase64 = imageBase64;
    const imgMime = imageMimeType;
    clearImage();

    setTyping(true); setLoading(true);
    try {
      const payload = { conversationId, message: text };
      if (imgBase64) {
        payload.image = imgBase64;
        payload.imageMimeType = imgMime;
      }
      const res = await api.post('/chat', payload);
      if (res.data.conversationId) { setConversationId(res.data.conversationId); loadConversations(); }
      setMessages(prev => [...prev, { role: 'bot', content: res.data.response.content, advisory: res.data.response.advisory }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: `Sorry, something went wrong: ${err.response?.data?.error || err.message}`, advisory: null }]);
    } finally { setTyping(false); setLoading(false); }
  }

  function handleLogout() {
    localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user'); navigate('/signin');
  }

  return (
    <div className="flex flex-col h-screen bg-[#f0f7f0] dark:bg-gray-900 overflow-hidden transition-colors duration-300 relative">

      {/* Background image - same as SignIn/SignUp */}
      <div className="absolute inset-0 bg-cover bg-center opacity-10 dark:opacity-20 pointer-events-none"
        style={{ backgroundImage: 'url(/agroBot_BG.png)', filter: 'blur(2px)', transform: 'scale(1.05)' }}
      />

      {/* Sidebar */}
      {showSidebar && (<>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowSidebar(false)} />
        <div className="fixed left-0 top-0 bottom-0 w-full sm:w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col transition-colors">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1a4d1a] dark:text-green-400">Conversation History</h2>
              <button onClick={() => setShowSidebar(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">✕</button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Your recent farm assistant chats</p>
            <button onClick={startNewChat} className="w-full bg-[#1a4d1a] dark:bg-green-600 text-white rounded-lg px-4 py-3 font-semibold hover:bg-[#2d6a2d] dark:hover:bg-green-700 transition flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="10" r="1" fill="white"/>
                <circle cx="12" cy="10" r="1" fill="white"/>
                <circle cx="15" cy="10" r="1" fill="white"/>
              </svg>
              Start New Consult
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <div className="text-center text-gray-400 dark:text-gray-500 mt-8 text-sm">No conversations yet</div>
            ) : conversations.map(conv => (
              <div key={conv._id} onClick={() => { loadConversation(conv._id); setShowSidebar(false); }}
                className={`p-3 mb-2 rounded-lg cursor-pointer transition ${conv._id === conversationId ? 'bg-[#e8f5e9] dark:bg-green-900/40 border-l-4 border-[#1a4d1a] dark:border-green-400' : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800 dark:text-white truncate">{conv.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-300 truncate mt-1">{conv.lastMessage}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-400 mt-1">{formatDate(conv.updatedAt)}</div>
                  </div>
                  <button onClick={(e) => deleteChat(conv._id, e)} className="text-gray-400 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-sm flex-shrink-0">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>)}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-50 flex items-center justify-between px-3 sm:px-4 transition-colors">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSidebar(!showSidebar)} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition">
            {showSidebar ? (
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
          <img src="/agro_icon.png" alt="AgroBot BD" className="w-8 h-8 rounded-full" />
          <span className="font-bold text-[#1a4d1a] dark:text-green-400 text-sm sm:text-base">AgroBot BD</span>
        </div>
        <div className="flex items-center gap-2 relative">
          <ThemeToggle />
          <button className="w-9 h-9 rounded-full bg-[#e8f5e9] dark:bg-gray-700 flex items-center justify-center text-base hover:bg-[#c8e6c9] dark:hover:bg-gray-600 transition">🔔</button>
          <button onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
            className="w-9 h-9 rounded-full bg-[#e8f5e9] dark:bg-gray-700 flex items-center justify-center overflow-hidden border-[3px] border-[#1a4d1a] dark:border-green-500 hover:bg-[#c8e6c9] dark:hover:bg-gray-600 transition">
            <img src="/user_icon.png" alt="profile" className="w-full h-full object-cover rounded-full" />
          </button>
          {showDropdown && (
            <div className="absolute top-11 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 min-w-[180px] sm:min-w-[200px] z-50 transition-colors" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#e8f5e9] dark:bg-gray-700 border-[2.5px] border-[#1a4d1a] dark:border-green-500 overflow-hidden">
                  <img src="/user_icon.png" alt="avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">{user.name || 'User'}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{user.email || ''}</div>
                </div>
              </div>
              <hr className="my-2 border-gray-100 dark:border-gray-700" />
              <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition flex items-center gap-2">
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

      {showDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />}

      {/* Messages */}
      <main className="flex-1 overflow-y-auto pt-16 pb-48 px-2 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center my-4">
            <span className="text-xs font-semibold tracking-widest text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 rounded-full px-4 py-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          {messages.map((msg, i) => msg.role === 'bot' ? <BotMessage key={i} content={msg.content} advisory={msg.advisory} /> : <UserMessage key={i} content={msg.content} imagePreview={msg.imagePreview} />)}
          {typing && <TypingIndicator />}
          <div ref={bottomRef} className="h-8" />
        </div>
      </main>

      <div className="fixed bottom-16 left-0 right-0 px-2 sm:px-4 py-2 sm:py-3 bg-[#f0f7f0] dark:bg-gray-900 transition-colors">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 mb-2 sm:mb-3 overflow-x-auto pb-1 sm:pb-2 scrollbar-hide">
            <button onClick={() => setInput('How to control pests in rice?')} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#a8d5a8] dark:bg-green-700 text-[#1a4d1a] dark:text-white text-xs sm:text-sm font-medium whitespace-nowrap hover:bg-[#8fc98f] dark:hover:bg-green-600 transition">How to control pests in rice?</button>
            <button onClick={() => setInput('Best fertilizer for Rice?')} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-medium whitespace-nowrap border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition">Best fertilizer for Rice?</button>
            <button onClick={() => setInput("Today's Weather")} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-medium whitespace-nowrap border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition">Today's Weather</button>
          </div>
          {/* Image preview above input */}
          {imagePreview && (
            <div className="mb-2 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-2xl px-3 py-2 shadow-sm">
              <img src={imagePreview} alt="preview" className="w-12 h-12 rounded-lg object-cover border border-[#c8e6c9] dark:border-green-700" />
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">📷 Crop photo ready to send</span>
              <button onClick={clearImage} className="text-gray-400 hover:text-red-500 text-lg leading-none">✕</button>
            </div>
          )}

          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-md transition-colors">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {/* Camera button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0"
              title="Upload crop photo"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="18" height="13" rx="2" fill="#a8d5a8" stroke="#1a4d1a" strokeWidth="2"/>
                <circle cx="12" cy="12.5" r="3.5" fill="#e8f5e9" stroke="#1a4d1a" strokeWidth="1.5"/>
                <circle cx="12" cy="12.5" r="2" fill="#2d6a2d"/>
                <circle cx="17" cy="9" r="1" fill="#1a4d1a"/>
                <path d="M3 8h3l1-2h10l1 2h3" stroke="#1a4d1a" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
              placeholder={imagePreview ? "Add a message (optional)..." : "Type your question..."}
              className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500" />
            <button onClick={sendMessage} disabled={loading || (!input.trim() && !imageBase64)}
              className="w-10 h-10 rounded-full bg-[#1a4d1a] dark:bg-green-600 text-white flex items-center justify-center flex-shrink-0 hover:bg-[#2d6a2d] dark:hover:bg-green-700 transition disabled:bg-gray-400 dark:disabled:bg-gray-600">➤</button>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-sm flex transition-colors">
        <button onClick={() => setShowSidebar(true)} className="flex-1 flex flex-col items-center justify-center gap-1 text-xs transition text-[#1a4d1a] dark:text-green-400">
          <div className="w-10 h-10 rounded-2xl bg-[#e8f5e9] dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="#1a4d1a" className="dark:hidden"/>
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="#4ade80" className="hidden dark:block"/>
            </svg>
          </div>
          Chat
        </button>
        {[{ icon: '🌾', label: 'Crops' }, { icon: '☀️', label: 'Weather' }, { icon: 'community', label: 'Community' }].map(({ icon, label }) => (
          <button key={label} className="flex-1 flex flex-col items-center justify-center gap-1 text-xs transition text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400">
            {icon === 'community' ? (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="7" r="3" fill="#4ade80"/><circle cx="15" cy="7" r="3" fill="#2d6a2d"/>
                <ellipse cx="9" cy="16" rx="5" ry="3.5" fill="#86efac"/><ellipse cx="15" cy="16" rx="5" ry="3.5" fill="#a8d5a8"/>
              </svg>
            ) : <span className="text-xl">{icon}</span>}
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
