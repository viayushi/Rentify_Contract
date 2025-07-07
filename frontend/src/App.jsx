import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyDetails from './pages/PropertyDetails';
import AddProperty from './pages/AddProperty';
import EditProperty from './pages/EditProperty';
import MyProperties from './pages/MyProperties';
import Messages from './pages/Messages';
import ChatPage from './pages/ChatPage';
import CreateContract from './pages/CreateContract';
import Contracts from './pages/Contracts';
import Settings from './pages/Settings';
import './App.css';

function AppRoutes() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 w-full mx-auto">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/property/:id" element={<PropertyDetails />} />
          <Route path="/add-property" element={<AddProperty />} />
          <Route path="/my-properties" element={<MyProperties />} />
          <Route path="/edit-property/:id" element={<EditProperty />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat/:chatId" element={<ChatPage />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/create-contract" element={<CreateContract />} />
          <Route path="/contracts" element={<Contracts />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;