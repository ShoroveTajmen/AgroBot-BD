import axios from 'axios';

if (localStorage.getItem('auth_token')) window.location.href = '/';

const form = document.getElementById('signupForm');
const errorMsg = document.getElementById('errorMsg');
const signupBtn = document.getElementById('signupBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.classList.add('hidden');

  const password = document.getElementById('password').value;
  if (password.length < 6) {
    errorMsg.textContent = 'Password must be at least 6 characters';
    errorMsg.classList.remove('hidden');
    return;
  }

  signupBtn.disabled = true;
  signupBtn.textContent = 'Creating account...';

  try {
    const res = await axios.post('/api/auth/signup', {
      name: document.getElementById('name').value.trim(),
      username: document.getElementById('username').value.trim(),
      email: document.getElementById('email').value.trim(),
      password,
      district: document.getElementById('district').value
    });
    localStorage.setItem('auth_token', res.data.token);
    localStorage.setItem('auth_user', JSON.stringify(res.data.user));
    window.location.href = '/';
  } catch (err) {
    errorMsg.textContent = err.response?.data?.error || 'Sign up failed. Please try again.';
    errorMsg.classList.remove('hidden');
  } finally {
    signupBtn.disabled = false;
    signupBtn.textContent = 'Start Growing →';
  }
});
