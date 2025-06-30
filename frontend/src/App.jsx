import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './store';
import { getCurrentUser } from './store/slices/authSlice';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Pages
import HomePage from './pages/HomePage';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import MyPropertiesPage from './pages/MyPropertiesPage';
import AddPropertyPage from './pages/AddPropertyPage';
import EditPropertyPage from './pages/EditPropertyPage';
import MessagesPage from './pages/MessagesPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';
import AgreementsPage from './pages/AgreementsPage';
import AgreementDetailPage from './pages/AgreementDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import MyPropertyDetailPage from './pages/MyPropertyDetailPage';
import LegalMessagesPage from './pages/LegalMessagesPage';
import LegalContractPage from './pages/LegalContractPage';

// Socket service
import { initializeSocket } from './services/socketService';

function App() {
  useEffect(() => {
    // Check if user is authenticated on app load
    const token = localStorage.getItem('token');
    if (token) {
      store.dispatch(getCurrentUser());
    }
    
    // Initialize socket connection
    initializeSocket();
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-secondary-50">
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/properties" element={<PropertiesPage />} />
              <Route path="/properties/:id" element={<PropertyDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected Routes */}
              <Route path="/my-properties" element={
                <ProtectedRoute>
                  <MyPropertiesPage />
                </ProtectedRoute>
              } />
              <Route path="/add-property" element={
                <ProtectedRoute>
                  <AddPropertyPage />
                </ProtectedRoute>
              } />
              <Route path="/edit-property/:id" element={
                <ProtectedRoute>
                  <EditPropertyPage />
                </ProtectedRoute>
              } />
              <Route path="/messages" element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              } />
              <Route path="/orders/:id" element={
                <ProtectedRoute>
                  <OrderDetailPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/agreements" element={
                <ProtectedRoute>
                  <AgreementsPage />
                </ProtectedRoute>
              } />
              <Route path="/agreements/:id" element={
                <ProtectedRoute>
                  <AgreementDetailPage />
                </ProtectedRoute>
              } />
              <Route path="/my-properties/:id" element={<MyPropertyDetailPage />} />
              <Route path="/legal-messages" element={<LegalMessagesPage />} />
              <Route path="/legal-contracts/:orderId" element={<LegalContractPage />} />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
          
          {/* Global Components */}
          <LoadingSpinner />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
      </div>
      </Router>
    </Provider>
  );
}

export default App;
