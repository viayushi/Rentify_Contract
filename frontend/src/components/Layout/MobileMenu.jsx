import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { X, Home, Building2, MessageSquare, ShoppingCart, User, FileText, Plus } from 'lucide-react';
import { closeMobileMenu } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';

const MobileMenu = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { unreadCount: messageUnreadCount } = useSelector(state => state.messages);
  const { unreadCount: orderUnreadCount } = useSelector(state => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(closeMobileMenu());
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'My Properties', href: '/my-properties', icon: Building2 },
    { name: 'Add Property', href: '/add-property', icon: Plus },
    { 
      name: 'Messages', 
      href: '/messages', 
      icon: MessageSquare, 
      badge: messageUnreadCount 
    },
    { 
      name: 'Orders', 
      href: '/orders', 
      icon: ShoppingCart, 
      badge: orderUnreadCount 
    },
    { name: 'Agreements', href: '/agreements', icon: FileText },
    { name: 'Profile', href: '/profile', icon: User }
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => dispatch(closeMobileMenu())} />
      
      <div className="fixed inset-y-0 right-0 w-64 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-secondary-200">
          <h2 className="text-lg font-semibold text-secondary-900">Menu</h2>
          <button
            onClick={() => dispatch(closeMobileMenu())}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4">
          {/* User Info */}
          <div className="flex items-center space-x-3 p-3 bg-secondary-50 rounded-lg mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              {user?.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user.name} 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-primary-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-secondary-500 truncate">
                {user?.role === 'seller' ? 'Property Seller' : 'Property Buyer'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => dispatch(closeMobileMenu())}
                  className="flex items-center px-3 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 rounded-md transition-colors"
                >
                  <Icon className="mr-3 h-5 w-5 text-secondary-400" />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-error-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="mt-6 pt-6 border-t border-secondary-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 rounded-md transition-colors"
            >
              <User className="mr-3 h-5 w-5 text-secondary-400" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu; 