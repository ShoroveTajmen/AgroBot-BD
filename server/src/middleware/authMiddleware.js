import { authService } from '../services/authService.js';

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    const decoded = authService.verify(header.substring(7));
    const user = await authService.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found. Please sign in again.' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please sign in again.' });
  }
};
