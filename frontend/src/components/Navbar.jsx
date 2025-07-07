import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home } from 'lucide-react';
import { FaSignInAlt, FaUserPlus, FaUserCircle, FaCog, FaSignOutAlt, FaUser, FaExchangeAlt, FaTrash } from 'react-icons/fa';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // Demo unread count for JSON-only environment
  useEffect(() => {
    if (user) {
      // Set a demo unread count
      setUnread(2);
    }
  }, [user]);

  useEffect(() => {
    if (location.pathname === '/messages') {
      setUnread(0);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    try {
      // Clear all localStorage data
      localStorage.clear();
      logout();
      navigate('/');
      alert('Account deleted successfully!');
    } catch (err) {
      alert('Failed to delete account.');
    }
  };

  return (
    <nav className="fixed left-0 right-0 top-6 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-4xl mx-auto bg-green-900/80 shadow-2xl rounded-2xl border border-green-800 px-6 py-3 flex items-center justify-between gap-4 backdrop-blur-md">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}> 
          <Home className="h-8 w-8 text-white" />
          <span className="text-2xl font-extrabold text-white tracking-tight">Rentify</span>
        </div>
        {/* Nav Links */}
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className={`text-lg font-semibold transition-colors duration-150 ${location.pathname === '/dashboard' ? 'text-white' : 'text-gray-100 hover:text-white'}`}>Dashboard</Link>
          <Link to="/properties" className={`text-lg font-semibold transition-colors duration-150 ${location.pathname === '/properties' ? 'text-white' : 'text-gray-100 hover:text-white'}`}>Properties</Link>
          <Link to="/messages" className={`text-lg font-semibold transition-colors duration-150 relative ${location.pathname === '/messages' ? 'text-white' : 'text-gray-100 hover:text-white'}`}>
            Messages
            {unread > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unread}
              </span>
            )}
          </Link>
        </div>
        {/* Auth/Profile */}
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link to="/login" className="flex items-center gap-2 px-5 py-2 rounded-lg bg-white text-green-900 font-bold shadow hover:bg-gray-100 transition-all duration-150">
                <FaSignInAlt /> Login
              </Link>
              <Link to="/register" className="flex items-center gap-2 px-5 py-2 rounded-lg bg-green-800 text-white font-bold shadow hover:bg-green-700 transition-all duration-150">
                <FaUserPlus /> Register
              </Link>
            </>
          ) : (
            <div className="relative group" onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)}>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-green-900 font-bold shadow hover:bg-gray-100 transition-all duration-150" onClick={() => setDropdownOpen(v => !v)}>
                <img src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} alt="Profile" className="h-8 w-8 rounded-full border-2 border-green-900" />
                <span>{user.name}</span>
                <FaUserCircle className="ml-1 text-green-800" />
              </button>
              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg transition-all duration-200 z-50 flex flex-col">
                  <Link to="/settings" className="flex items-center gap-2 px-4 py-2 text-green-900 hover:bg-gray-100">
                    <FaCog /> Settings
                  </Link>
                  <button onClick={handleDeleteAccount} className="flex items-center gap-2 px-4 py-2 text-red-700 hover:bg-red-100 text-left w-full">
                    <FaTrash /> Delete Account
                  </button>
                  <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 text-left w-full">
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 