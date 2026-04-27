import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

const DISTRICTS = ['Dhaka','Chittagong','Rajshahi','Khulna','Barisal','Sylhet','Rangpur','Mymensingh'];

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', district: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', form);
      localStorage.setItem('auth_token', res.data.token);
      localStorage.setItem('auth_user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const InputWrap = ({ icon, children }) => (
    <div className="flex items-center bg-gray-100 border border-gray-200 rounded-lg px-3 focus-within:border-[#2d6a2d] focus-within:bg-white transition">
      <span className="text-gray-400 mr-2 text-sm">{icon}</span>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #f0f7f0 0%, #e8f5e9 60%, #f5fff5 100%)' }}>

      <div className="bg-white rounded-2xl shadow-lg p-7 w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-3">
          <img src="/agro_icon.png" alt="AgroBot"
            className="w-14 h-14 rounded-full border-4 border-[#c8e6c9] bg-[#e8f5e9] p-1 shadow-md" />
        </div>

        <h1 className="text-center text-2xl font-bold text-[#1a4d1a] mb-1">Welcome, Farmer</h1>
        <p className="text-center text-gray-500 text-sm mb-5 leading-relaxed">
          Join AgroBot BD to grow smarter and achieve better yields for your family.
        </p>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-2 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold tracking-widest text-gray-500 mb-1 uppercase">Full Name</label>
            <InputWrap icon="👤">
              <input type="text" value={form.name} onChange={set('name')}
                placeholder="Enter your full name" required
                className="flex-1 bg-transparent py-2.5 text-sm outline-none text-gray-800 placeholder-gray-400" />
            </InputWrap>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-bold tracking-widest text-gray-500 mb-1 uppercase">Username</label>
            <InputWrap icon="@">
              <input type="text" value={form.username} onChange={set('username')}
                placeholder="Choose a unique username" required
                className="flex-1 bg-transparent py-2.5 text-sm outline-none text-gray-800 placeholder-gray-400" />
            </InputWrap>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold tracking-widest text-gray-500 mb-1 uppercase">Email Address</label>
            <InputWrap icon="✉">
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="example@email.com" required
                className="flex-1 bg-transparent py-2.5 text-sm outline-none text-gray-800 placeholder-gray-400" />
            </InputWrap>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold tracking-widest text-gray-500 mb-1 uppercase">Password</label>
            <InputWrap icon="🔒">
              <input type="password" value={form.password} onChange={set('password')}
                placeholder="Enter a strong password" required
                className="flex-1 bg-transparent py-2.5 text-sm outline-none text-gray-800 placeholder-gray-400" />
            </InputWrap>
          </div>

          {/* District */}
          <div>
            <label className="block text-xs font-bold tracking-widest text-gray-500 mb-1 uppercase">Farming District</label>
            <InputWrap icon="📍">
              <select value={form.district} onChange={set('district')}
                className="flex-1 bg-transparent py-2.5 text-sm outline-none text-gray-600 cursor-pointer">
                <option value="">Select your district</option>
                {DISTRICTS.map(d => (
                  <option key={d} value={d.toLowerCase()}>{d}</option>
                ))}
              </select>
            </InputWrap>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1a4d1a] text-white rounded-full font-semibold text-sm hover:bg-[#2d6a2d] transition disabled:bg-gray-400 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Creating account...' : 'Start Growing →'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already using AgroBot BD?{' '}
          <Link to="/signin" className="font-bold text-[#1a4d1a] hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
