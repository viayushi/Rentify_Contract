import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Check for success message from registration
  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear the state to prevent showing the message again on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 flex items-center gap-2 text-green-900 font-semibold hover:underline"
        >
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        <h2 className="text-3xl font-bold text-green-900 mb-6 text-center">Login to Rentify</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-green-800" />
            <input
              type="email"
              autoComplete="username"
              className="pl-10 pr-4 py-3 rounded-lg border border-gray-200 w-full focus:outline-none focus:ring-2 focus:ring-green-800 text-green-900 bg-gray-50"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-green-800" />
            <input
              type="password"
              autoComplete="current-password"
              className="pl-10 pr-4 py-3 rounded-lg border border-gray-200 w-full focus:outline-none focus:ring-2 focus:ring-green-800 text-green-900 bg-gray-50"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          {success && <div className="text-green-600 text-sm text-center">{success}</div>}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-green-900 text-white font-bold text-lg shadow hover:bg-green-800 transition-all duration-150 mt-2"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login; 