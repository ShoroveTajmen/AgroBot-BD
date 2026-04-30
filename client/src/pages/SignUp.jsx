import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import ThemeToggle from '../components/ThemeToggle.jsx';

const DISTRICTS = ['Dhaka','Chittagong','Rajshahi','Khulna','Barisal','Sylhet','Rangpur','Mymensingh'];

const InputWrap = ({ icon, children }) => (
  <div className="flex items-center bg-[#e8f0e8] dark:bg-gray-700 border border-[#d0e0d0] dark:border-gray-600 rounded-lg px-3 focus-within:border-[#2d6a2d] dark:focus-within:border-green-500 transition">
    <span className="mr-2 text-sm flex-shrink-0">{icon}</span>
    {children}
  </div>
);

export default function SignUp() {
  const navigate = useNavigate();
  const [name, setName]         = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [district, setDistrict] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', { name, username, email, password, district });
      localStorage.setItem('auth_token', res.data.token);
      localStorage.setItem('auth_user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "flex-1 bg-transparent py-2.5 text-sm outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500";

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-300">

      {/* Background image */}
      <div className="absolute inset-0 bg-cover bg-center dark:opacity-40"
        style={{ backgroundImage: 'url(/agroBot_BG.png)', filter: 'blur(3px)', transform: 'scale(1.1)' }}
      />
      {/* Light gradient */}
      <div className="absolute inset-0 dark:hidden"
        style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0.97) 70%, #fff 100%)' }}
      />
      {/* Dark gradient */}
      <div className="absolute inset-0 hidden dark:block"
        style={{ background: 'linear-gradient(to bottom, rgba(17,24,39,0) 0%, rgba(17,24,39,0.6) 40%, rgba(17,24,39,0.97) 70%, #111827 100%)' }}
      />

      {/* Theme toggle top-right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-4 sm:py-6">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-7 w-full max-w-md border border-white/50 dark:border-gray-700 transition-colors duration-300">

          {/* Logo */}
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-700 shadow-lg flex items-center justify-center border-4 border-[#c8e6c9] dark:border-green-700">
              <img src="/agro_icon.png" alt="AgroBot" className="w-12 h-12 rounded-full" />
            </div>
          </div>

          <h1 className="text-center text-xl sm:text-2xl font-bold text-[#1a4d1a] dark:text-green-400 mb-1">Welcome, Farmer</h1>
          <p className="text-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-4 sm:mb-5 leading-relaxed">
            Join AgroBot BD to grow smarter and achieve better yields for your family.
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg px-4 py-2 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 mb-1 uppercase">Full Name</label>
              <InputWrap icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="#2d6a2d" className="dark:hidden"/><circle cx="12" cy="8" r="4" fill="#fb923c" className="hidden dark:block"/><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" stroke="#1a4d1a" strokeWidth="2" strokeLinecap="round" className="dark:hidden"/><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" className="hidden dark:block"/></svg>}>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" required className={inputCls} />
              </InputWrap>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 mb-1 uppercase">Username</label>
              <InputWrap icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#c8e6c9" stroke="#1a4d1a" strokeWidth="2"/><text x="12" y="16" textAnchor="middle" fill="#1a4d1a" fontSize="12" fontWeight="bold">@</text></svg>}>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a unique username" required className={inputCls} />
              </InputWrap>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 mb-1 uppercase">Email Address</label>
              <InputWrap icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" fill="#a8d5a8" stroke="#1a4d1a" strokeWidth="2"/><path d="M3 7l9 6 9-6" stroke="#1a4d1a" strokeWidth="2" strokeLinecap="round"/></svg>}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" required className={inputCls} />
              </InputWrap>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 mb-1 uppercase">Password</label>
              <InputWrap icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" fill="#fed7aa" stroke="#f97316" strokeWidth="2"/><path d="M8 11V7a4 4 0 018 0v4" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="16" r="1.5" fill="#f97316"/></svg>}>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter a strong password" required className={inputCls} />
              </InputWrap>
            </div>

            {/* District */}
            <div>
              <label className="block text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 mb-1 uppercase">Farming District</label>
              <InputWrap icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><rect x="3" y="10" width="6" height="8" rx="1" fill="#fca5a5" stroke="#dc2626" strokeWidth="1.5"/><rect x="10" y="7" width="6" height="11" rx="1" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1.5"/><rect x="17" y="12" width="4" height="6" rx="1" fill="#86efac" stroke="#16a34a" strokeWidth="1.5"/><path d="M3 18h18" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/></svg>}>
                <select value={district} onChange={e => setDistrict(e.target.value)} className="flex-1 bg-transparent py-2.5 text-sm outline-none text-gray-600 dark:text-gray-300 cursor-pointer">
                  <option value="">Select your district</option>
                  {DISTRICTS.map(d => <option key={d} value={d.toLowerCase()}>{d}</option>)}
                </select>
              </InputWrap>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#1a4d1a] dark:bg-green-600 text-white rounded-full font-semibold text-sm hover:bg-[#2d6a2d] dark:hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed mt-2">
              {loading ? 'Creating account...' : 'Sign Up →'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Already using AgroBot BD?{' '}
            <Link to="/signin" className="font-bold text-[#1a4d1a] dark:text-green-400 hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
