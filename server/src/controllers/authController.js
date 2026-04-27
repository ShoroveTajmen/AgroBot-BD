import { authService } from '../services/authService.js';

export const signup = async (req, res) => {
  try {
    const { name, username, email, password, district } = req.body;
    if (!name || !username || !email || !password)
      return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const result = await authService.register({ name, username, email, password, district });
    res.status(201).json(result);
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(400).json({ error: err.message });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err) {
    console.error('Signin error:', err.message);
    res.status(401).json({ error: err.message });
  }
};

export const profile = async (req, res) => {
  res.json({ user: req.user });
};
