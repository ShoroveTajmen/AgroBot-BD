/**
 * authMiddleware.js — JWT Authentication Middleware
 *
 * Verifies the Bearer token on every protected route.
 * On success, attaches the full user object to req.user so controllers
 * can access the authenticated user without querying the DB again.
 *
 * Usage:
 *   router.get('/protected', authenticate, handler)
 *
 * Expected header:
 *   Authorization: Bearer <jwt_token>
 */

import { authService } from '../services/authService.js';

/**
 * authenticate — Express middleware that validates a JWT Bearer token.
 *
 * Flow:
 *  1. Check for Authorization header starting with "Bearer "
 *  2. Extract and verify the token using authService.verify()
 *  3. Look up the user in MongoDB by the decoded userId
 *  4. Attach user to req.user and call next()
 *
 * @returns {401} If token is missing, invalid, expired, or user no longer exists
 */
export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    // Reject requests without a Bearer token
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    // Verify the JWT and decode the payload
    const decoded = authService.verify(header.substring(7)); // strip "Bearer " prefix

    // Confirm the user still exists in the database
    const user = await authService.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found. Please sign in again.' });

    // Attach user to request for downstream handlers
    req.user = user;
    next();
  } catch (err) {
    // jwt.verify() throws on invalid or expired tokens
    return res.status(401).json({ error: 'Invalid or expired token. Please sign in again.' });
  }
};
