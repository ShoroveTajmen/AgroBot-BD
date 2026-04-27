import axios from 'axios';

// ── Auth guard ──
const token = localStorage.getItem('auth_token');
if (!token) window.location.href = '/signin.html';

const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
document.getElementById('dName').textContent = user.name || 'User';
document.getElementById('dEmail').textContent = user.email || '';

// ── Profile dropdown ──
const profileBtn = document.getElementById('profileBtn');
const dropdown = document.getElementById('dropdown');
profileBtn.addEventListener('click', e => { e.stopPropagation(); dropdown.classList.toggle('hidden'); });
document.addEventListener('click', () => dropdown.classList.add('hidden'));

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('agrobot_conversationId');
  window.location.href = '/signin.html';
});

// ── Helpers ──
const headers = () => ({ headers: { Authorization: `Bearer ${token}` } });
const container = document.getElementById('msgContainer');
const wrap = document.getElementById('messagesWrap');
let conversationId = localStorage.getItem('agrobot_conversationId') || null;

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escHtml(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatText(t) {
  return t
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function buildAdvisory(a) {
  if (!a?.likelyDisease) return '';
  let h = `<div class="advisory-card">
    <h4>📋 ${a.likelyDisease}</h4>
    <p><strong>Confidence:</strong> ${a.confidence || 'Medium'} &nbsp;|&nbsp; <strong>Cause:</strong> ${a.causeType || 'Unknown'}</p>`;
  if (a.recommendedActions?.length)
    h += `<ul>${a.recommendedActions.map(x => `<li>${x}</li>`).join('')}</ul>`;
  if (a.escalateToAgronomist)
    h += `<div class="escalation-warn">⚠️ Please consult an agronomist immediately.</div>`;
  h += `</div>`;
  return h;
}

function addMsg(role, content, advisory = null) {
  const row = document.createElement('div');
  row.className = `msg-row ${role}`;
  const t = nowTime();

  if (role === 'bot') {
    row.innerHTML = `
      <div class="avatar"><img src="/agro_icon.png" alt="bot" /></div>
      <div class="msg-content">
        <div class="bubble">${formatText(content)}${buildAdvisory(advisory)}</div>
        <div class="msg-time">${t}</div>
      </div>`;
  } else {
    row.innerHTML = `
      <div class="msg-content">
        <div class="bubble">${escHtml(content)}</div>
        <div class="msg-time">${t}</div>
      </div>`;
  }
  container.appendChild(row);
  wrap.scrollTop = wrap.scrollHeight;
  return row;
}

function addTyping() {
  const row = document.createElement('div');
  row.className = 'msg-row bot';
  row.innerHTML = `
    <div class="avatar"><img src="/agro_icon.png" alt="bot" /></div>
    <div class="msg-content">
      <div class="bubble">
        <div class="typing">
          <div class="dot"></div><div class="dot"></div><div class="dot"></div>
        </div>
      </div>
    </div>`;
  container.appendChild(row);
  wrap.scrollTop = wrap.scrollHeight;
  return row;
}

// ── Load history ──
async function loadHistory() {
  try {
    const res = await axios.get('/api/conversations', headers());
    const convs = res.data.conversations;
    if (convs.length > 0) {
      conversationId = convs[0]._id;
      localStorage.setItem('agrobot_conversationId', conversationId);

      const full = await axios.get(`/api/conversations/${conversationId}`, headers());
      const msgs = full.data.conversation.messages;
      if (msgs.length > 0) {
        msgs.forEach(m => addMsg(m.role === 'assistant' ? 'bot' : 'user', m.content, m.advisory));
        return;
      }
    }
  } catch (e) {
    console.warn('History load failed:', e.message);
  }
  addMsg('bot', `Assalamu Alaikum! I am AgroBot. How can I help with your crops today?\nYou can ask me about weather, pest control, or describe your crop problem.`);
}

loadHistory();

// ── Send message ──
const sendBtn = document.getElementById('sendBtn');
const msgInput = document.getElementById('msgInput');

async function send() {
  const text = msgInput.value.trim();
  if (!text) return;
  msgInput.value = '';
  sendBtn.disabled = true;

  addMsg('user', text);
  const typing = addTyping();

  try {
    const res = await axios.post('/api/chat', { conversationId, message: text }, headers());
    if (res.data.conversationId) {
      conversationId = res.data.conversationId;
      localStorage.setItem('agrobot_conversationId', conversationId);
    }
    typing.remove();
    addMsg('bot', res.data.response.content, res.data.response.advisory);
  } catch (err) {
    typing.remove();
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/signin.html';
    } else {
      addMsg('bot', `Sorry, something went wrong: ${err.response?.data?.error || err.message}`);
    }
  } finally {
    sendBtn.disabled = false;
    msgInput.focus();
  }
}

sendBtn.addEventListener('click', send);
msgInput.addEventListener('keypress', e => { if (e.key === 'Enter') send(); });
