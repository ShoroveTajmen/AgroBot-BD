import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/signin', { email, password });
      localStorage.setItem('auth_token', res.data.token);
      localStorage.setItem('auth_user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #f0f7f0 0%, #e8f5e9 60%, #f5fff5 100%)' }}>

      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2 font-bold text-[#1a4d1a]">
          <img src="/agro_icon.png" alt="AgroBot BD" className="w-8 h-8 rounded-full" />
          AgroBot BD
        </div>
        <button className="w-8 h-8 rounded-full border-2 border-[#1a4d1a] text-[#1a4d1a] font-bold text-sm">?</button>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img src="/agro_icon.png" alt="AgroBot"
              className="w-16 h-16 rounded-full border-4 border-[#c8e6c9] bg-[#e8f5e9] p-1" />
          </div>

          <h1 className="text-center text-2xl font-bold text-[#1a4d1a] mb-1">Welcome Back</h1>
          <p className="text-center text-gray-500 text-sm mb-6">Sign in to manage your crops and check field data</p>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-2 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold tracking-widest text-gray-500 mb-1 uppercase">Email Address</label>
              <div className="flex items-center bg-gray-100 border border-gray-200 rounded-lg px-3 focus-within:border-[#2d6a2d] focus-within:bg-white transition">
                <span className="text-gray-400 mr-2">✉</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. name@example.com"
                  required
                  className="flex-1 bg-transparent py-3 text-sm outline-none text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold tracking-widest text-gray-500 uppercase">Password</label>
                <a href="#" className="text-xs text-[#2d6a2d] hover:underline">Forgot Password?</a>
              </div>
              <div className="flex items-center bg-gray-100 border border-gray-200 rounded-lg px-3 focus-within:border-[#2d6a2d] focus-within:bg-white transition">
                <span className="text-gray-400 mr-2">🔒</span>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="flex-1 bg-transparent py-3 text-sm outline-none text-gray-800 placeholder-gray-400"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="text-gray-400 text-sm ml-1">
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Keep signed in */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <input type="checkbox" id="keep" className="accent-[#2d6a2d] w-4 h-4" />
              <label htmlFor="keep">Keep me signed in</label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1a4d1a] text-white rounded-lg font-semibold text-sm hover:bg-[#2d6a2d] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Login →'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/signup" className="font-bold text-[#1a4d1a] hover:underline">Register Now</Link>
        </p>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 pb-4">
        <a href="#" className="hover:underline">Privacy Policy</a> &bull; <a href="#" className="hover:underline">Terms of Service</a>
        <p className="mt-1">© 2024 AgroBot BD. Empowering Bangladeshi agriculture with AI solutions.</p>
      </footer>
    </div>
  );
}
