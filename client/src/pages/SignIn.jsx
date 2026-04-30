import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-300">

      {/* Background image */}
      <div className="absolute inset-0 bg-cover bg-center dark:opacity-40"
        style={{ backgroundImage: 'url(/agroBot_BG.png)', filter: 'blur(3px)', transform: 'scale(1.1)' }}
      />

      {/* Light gradient overlay */}
      <div className="absolute inset-0 dark:hidden"
        style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0.97) 70%, #fff 100%)' }}
      />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 hidden dark:block"
        style={{ background: 'linear-gradient(to bottom, rgba(17,24,39,0) 0%, rgba(17,24,39,0.6) 40%, rgba(17,24,39,0.97) 70%, #111827 100%)' }}
      />

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 font-bold text-[#1a4d1a] dark:text-green-400 text-sm sm:text-base">
          <img src="/agro_icon.png" alt="AgroBot BD" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full" />
          AgroBot BD
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-[#1a4d1a] dark:border-green-500 text-[#1a4d1a] dark:text-green-400 font-bold text-xs sm:text-sm">?</button>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-4 sm:pb-6">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md border border-white/50 dark:border-gray-700 transition-colors duration-300">

          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-white dark:bg-gray-700 shadow-lg flex items-center justify-center border-4 border-[#c8e6c9] dark:border-green-700">
              <img src="/agro_icon.png" alt="AgroBot" className="w-16 h-16 rounded-full" />
            </div>
          </div>

          <h1 className="text-center text-xl sm:text-2xl font-bold text-[#1a4d1a] dark:text-green-400 mb-1">Welcome Back</h1>
          <p className="text-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-5 sm:mb-6">Sign in to manage your crops and check field data</p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg px-4 py-2 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 mb-1 uppercase">Email Address</label>
              <div className="flex items-center bg-[#e8f0e8] dark:bg-gray-700 border border-[#d0e0d0] dark:border-gray-600 rounded-lg px-3 focus-within:border-[#2d6a2d] dark:focus-within:border-green-500 transition">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="5" width="18" height="14" rx="2" fill="#a8d5a8" stroke="#1a4d1a" strokeWidth="2"/>
                  <path d="M3 7l9 6 9-6" stroke="#1a4d1a" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. name@example.com" required
                  className="flex-1 bg-transparent py-3 text-sm outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 uppercase">Password</label>
                <a href="#" className="text-xs text-[#2d6a2d] dark:text-green-400 hover:underline">Forgot Password?</a>
              </div>
              <div className="flex items-center bg-[#e8f0e8] dark:bg-gray-700 border border-[#d0e0d0] dark:border-gray-600 rounded-lg px-3 focus-within:border-[#2d6a2d] dark:focus-within:border-green-500 transition">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" fill="#fed7aa" stroke="#f97316" strokeWidth="2"/>
                  <path d="M8 11V7a4 4 0 018 0v4" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="1.5" fill="#f97316"/>
                </svg>
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="flex-1 bg-transparent py-3 text-sm outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Keep signed in */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <input type="checkbox" id="keep" className="accent-[#2d6a2d] w-4 h-4" />
              <label htmlFor="keep">Keep me signed in</label>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#1a4d1a] dark:bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-[#2d6a2d] dark:hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="font-bold text-[#1a4d1a] dark:text-green-400 hover:underline">Register Now</Link>
        </p>
      </main>

      <footer className="relative z-10 text-center text-xs text-gray-600 dark:text-gray-400 pb-4 bg-white/80 dark:bg-gray-900/80">
        <a href="#" className="hover:underline">Privacy Policy</a> &bull; <a href="#" className="hover:underline">Terms of Service</a>
        <p className="mt-1">© 2024 AgroBot BD. Empowering Bangladeshi agriculture with AI solutions.</p>
      </footer>
    </div>
  );
}
