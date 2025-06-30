import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Home, 
  Building2, 
  MessageSquare, 
  ShoppingCart, 
  User, 
  FileText, 
  Plus,
  Settings,
  Bell
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useSelector(state => state.auth);
  const { unreadCount: messageUnreadCount } = useSelector(state => state.messages);
  const { unreadCount: orderUnreadCount } = useSelector(state => state.auth);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      current: location.pathname === '/'
    },
    {
      name: 'My Properties',
      href: '/my-properties',
      icon: Building2,
      current: location.pathname === '/my-properties'
    },
    {
      name: 'Add Property',
      href: '/add-property',
      icon: Plus,
      current: location.pathname === '/add-property'
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: MessageSquare,
      current: location.pathname === '/messages',
      badge: messageUnreadCount
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ShoppingCart,
      current: location.pathname === '/orders',
      badge: orderUnreadCount
    },
    {
      name: 'Agreements',
      href: '/agreements',
      icon: FileText,
      current: location.pathname === '/agreements'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      current: location.pathname === '/profile'
    },
    {
      name: 'Legal Chat',
      href: '/legal-messages',
      icon: MessageSquare,
      current: location.pathname === '/legal-messages'
    },
    {
      name: 'Legal Contracts',
      href: '/legal-contracts/sample', // Example link, can be dynamic in the future
      icon: FileText,
      current: location.pathname.startsWith('/legal-contracts')
    }
  ];

  return (
    <div className="bg-white shadow-sm border-r border-secondary-200 h-full">
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
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  item.current
                    ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 ${
                    item.current ? 'text-primary-600' : 'text-secondary-400 group-hover:text-secondary-500'
                  }`}
                />
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

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button className="w-full flex items-center px-3 py-2 text-sm text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 rounded-md transition-colors">
              <Bell className="mr-3 h-4 w-4 text-secondary-400" />
              Notifications
            </button>
            <button className="w-full flex items-center px-3 py-2 text-sm text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 rounded-md transition-colors">
              <Settings className="mr-3 h-4 w-4 text-secondary-400" />
              Settings
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-8 p-4 bg-primary-50 rounded-lg">
          <h3 className="text-sm font-semibold text-primary-900 mb-3">
            Quick Stats
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-secondary-600">Properties:</span>
              <span className="font-medium text-secondary-900">
                {user?.propertiesCount || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600">Messages:</span>
              <span className="font-medium text-secondary-900">
                {messageUnreadCount || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600">Orders:</span>
              <span className="font-medium text-secondary-900">
                {orderUnreadCount || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 