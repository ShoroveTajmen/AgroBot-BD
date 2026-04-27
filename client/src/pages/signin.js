import axios from 'axios';

// Redirect if already logged in
if (localStorage.getItem('auth_token')) window.location.href = '/';

const form = document.getElementById('signinForm');
const errorMsg = document.getElementById('errorMsg');
const loginBtn = document.getElementById('loginBtn');
const togglePw = document.getElementById('togglePw');
const pwInput = document.getElementById('password');

togglePw.addEventListener('click', () => {
  const isText = pwInput.type === 'text';
  pwInput.type = isText ? 'password' : 'text';
  togglePw.textContent = isText ? '👁' : '🙈';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.classList.add('hidden');
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';

  try {
    const res = await axios.post('/api/auth/signin', {
      email: document.getElementById('email').value.trim(),
      password: pwInput.value
    });
    localStorage.setItem('auth_token', res.data.token);
    localStorage.setItem('auth_user', JSON.stringify(res.data.user));
    window.location.href = '/';
  } catch (err) {
    errorMsg.textContent = err.response?.data?.error || 'Sign in failed. Please try again.';
    errorMsg.classList.remove('hidden');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login →';
  }
});
