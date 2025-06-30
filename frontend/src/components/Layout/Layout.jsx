import React from 'react';
import { useSelector } from 'react-redux';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import MobileMenu from './MobileMenu';

const Layout = ({ children }) => {
  const { sidebarOpen, mobileMenuOpen } = useSelector(state => state.ui);
  const { isAuthenticated } = useSelector(state => state.auth);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header />
      
      {/* Mobile Menu */}
      {mobileMenuOpen && <MobileMenu />}
      
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar - Only show if authenticated */}
        {isAuthenticated && (
          <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block lg:w-64 lg:flex-shrink-0`}>
            <Sidebar />
          </div>
        )}
        
        {/* Main Content Area */}
        <main className={`flex-1 ${isAuthenticated ? 'lg:ml-0' : ''}`}>
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Layout; 