/**
 * App.jsx — Root Component & Route Definitions
 *
 * Defines all client-side routes and applies authentication guards:
 *
 *   PrivateRoute — Requires a valid auth_token in localStorage.
 *                  Redirects unauthenticated users to /signin.
 *                  Used for protected pages (Chat).
 *
 *   PublicRoute  — Only accessible when NOT logged in.
 *                  Redirects authenticated users to / (Chat).
 *                  Used for auth pages (SignIn, SignUp) to prevent
 *                  logged-in users from seeing the login screen.
 *
 * Route map:
 *   /signin  → SignIn.jsx   (PublicRoute)
 *   /signup  → SignUp.jsx   (PublicRoute)
 *   /        → Chat.jsx     (PrivateRoute)
 *   /*       → Redirect to /
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import Chat from './pages/Chat.jsx';

/**
 * PrivateRoute — Renders children only if the user is authenticated.
 * Checks localStorage for auth_token on every render.
 */
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('auth_token');
  return token ? children : <Navigate to="/signin" replace />;
};

/**
 * PublicRoute — Renders children only if the user is NOT authenticated.
 * Prevents logged-in users from accessing the sign-in/sign-up pages.
 */
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('auth_token');
  return !token ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
      <Route path="/"       element={<PrivateRoute><Chat /></PrivateRoute>} />
      {/* Catch-all: redirect any unknown path to the home/chat page */}
      <Route path="*"       element={<Navigate to="/" replace />} />
    </Routes>
  );
}
