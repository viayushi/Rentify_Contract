import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Phone, Home, ArrowLeft } from 'lucide-react';

function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    role: 'buyer',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Password strength logic
  const getPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
    { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
    { label: 'One number', test: (pw) => /[0-9]/.test(pw) },
    { label: 'One special character', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
  ];

  const handlePasswordChange = (e) => {
    handleChange(e);
    setPasswordTouched(true);
    setPasswordStrength(getPasswordStrength(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await register(form);
    if (result.success) {
      // Redirect to login page after successful registration
      navigate('/login', { 
        state: { 
          message: 'Registration successful! Please login with your new account.' 
        } 
      });
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 pt-25">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 border border-gray-100 ">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 flex items-center gap-2 text-green-900 font-semibold hover:underline"
        >
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        <h2 className="text-3xl font-bold text-green-900 mb-6 text-center">Create Your Account</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-green-800" />
            <input
              type="text"
              name="name"
              className="pl-10 pr-4 py-3 rounded-lg border border-gray-200 w-full focus:outline-none focus:ring-2 focus:ring-green-800 text-green-900 bg-gray-50"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-green-800" />
            <input
              type="email"
              name="email"
              className="pl-10 pr-4 py-3 rounded-lg border border-gray-200 w-full focus:outline-none focus:ring-2 focus:ring-green-800 text-green-900 bg-gray-50"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-green-800" />
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              className="pl-10 pr-4 py-3 rounded-lg border border-gray-200 w-full focus:outline-none focus:ring-2 focus:ring-green-800 text-green-900 bg-gray-50"
              placeholder="Password"
              value={form.password}
              onChange={handlePasswordChange}
              onFocus={() => setPasswordTouched(true)}
              required
            />
            {/* Password Strength Bar */}
            {passwordTouched && (
              <div className="mt-2">
                <div
                  className={`h-2 rounded transition-all duration-300 ${
                    passwordStrength === 0
                      ? 'bg-gray-200'
                      : passwordStrength === 1
                      ? 'bg-red-500'
                      : passwordStrength === 2
                      ? 'bg-yellow-400'
                      : passwordStrength === 3
                      ? 'bg-blue-500'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${(passwordStrength / 4) * 100}%` }}
                />
                <div className="flex gap-2 mt-2 text-xs">
                  {passwordRequirements.map((req, idx) => (
                    <span
                      key={req.label}
                      className={`flex items-center gap-1 ${req.test(form.password) ? 'text-green-700' : 'text-gray-400'}`}
                    >
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: req.test(form.password) ? '#166534' : '#d1d5db' }} />
                      {req.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Confirm Password Field */}
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-green-800" />
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              className="pl-10 pr-4 py-3 rounded-lg border border-gray-200 w-full focus:outline-none focus:ring-2 focus:ring-green-800 text-green-900 bg-gray-50"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-5 w-5 text-green-800" />
            <input
              type="tel"
              name="phone"
              className="pl-10 pr-4 py-3 rounded-lg border border-gray-200 w-full focus:outline-none focus:ring-2 focus:ring-green-800 text-green-900 bg-gray-50"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="relative">
            <Home className="absolute left-3 top-3 h-5 w-5 text-green-800" />
            <input
              type="text"
              name="address"
              className="pl-10 pr-4 py-3 rounded-lg border border-gray-200 w-full focus:outline-none focus:ring-2 focus:ring-green-800 text-green-900 bg-gray-50"
              placeholder="Address"
              value={form.address}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex gap-4 items-center">
            <label className="text-green-900 font-semibold">Role:</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="rounded-lg border border-gray-200 px-4 py-2 bg-gray-50 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-800"
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-green-900 text-white font-bold text-lg shadow hover:bg-green-800 transition-all duration-150 mt-2"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
          <p className="text-center text-gray-600 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-green-900 font-semibold hover:underline">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register; 