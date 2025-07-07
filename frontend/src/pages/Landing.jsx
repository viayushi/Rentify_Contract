import React, { useEffect, useState } from 'react';
import { Home, Building2, MessageCircle, Search, MapPin, BedDouble, Bath, Home as HomeIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaList, FaPlus, FaSignOutAlt, FaCog, FaUserCircle, FaUserTie, FaUserAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { MdSwitchAccount } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import propertiesData from '../data/properties.json';
import StarRating from '../components/StarRating';
import socket, { registerSocketUser } from '../socket';
import axios from 'axios';

function Landing({ onLogin, onRegister, showHero = true, sidebarCollapsed, setSidebarCollapsed }) {
  // Filter state
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [properties, setProperties] = useState([]);
  const [visibleCount, setVisibleCount] = useState(9);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    // Load properties from JSON
    setProperties(propertiesData);
  }, []);

  // Register user with socket and listen for messages
  useEffect(() => {
    if (user) {
      registerSocketUser(user._id);
      
      // Listen for new messages
      const handleReceiveMessage = (newMessage) => {
        // Increment unread count if message is not from current user
        if (String(newMessage.sender?._id || newMessage.sender) !== String(user._id)) {
          setUnreadMessages(prev => prev + 1);
        }
      };

      socket.on('receive_message', handleReceiveMessage);

      // Fetch initial unread count
      const fetchUnreadCount = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/chat/unread-count', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setUnreadMessages(response.data.count || 0);
        } catch (err) {
          console.error('Error fetching unread count:', err);
        }
      };
      fetchUnreadCount();

      return () => {
        socket.off('receive_message', handleReceiveMessage);
      };
    }
  }, [user]);

  useEffect(() => {
    // Reset visibleCount when filters change
    setVisibleCount(9);
  }, [search, location, type, bedrooms, minPrice, maxPrice]);

  // Always work with an array
  const safeProperties = Array.isArray(properties) ? properties : [];

  // Filter logic
  const filtered = safeProperties.filter((p) => {
    const title = p.title || '';
    const loc = p.location || '';
    const propertyType = p.propertyType || p.type || '';
    const beds = p.bedrooms || (p.bedrooms === 0 ? 0 : p.bedrooms);
    const price = p.price || 0;
    const matchesSearch =
      search === '' ||
      title.toLowerCase().includes(search.toLowerCase()) ||
      loc.toLowerCase().includes(search.toLowerCase());
    const matchesLocation = location === '' || loc.toLowerCase().includes(location.toLowerCase());
    const matchesType = type === '' || propertyType === type;
    const matchesBedrooms = bedrooms === '' || beds === Number(bedrooms);
    const matchesMinPrice = minPrice === '' || price >= Number(minPrice);
    const matchesMaxPrice = maxPrice === '' || price <= Number(maxPrice);
    return matchesSearch && matchesLocation && matchesType && matchesBedrooms && matchesMinPrice && matchesMaxPrice;
  });

  // Debug logs
  // console.log('Loaded properties:', safeProperties);
  // console.log('Filtered properties:', filtered);
  // if (!Array.isArray(safeProperties) || safeProperties.length === 0) {
  //   console.warn('No properties loaded from backend or JSON.');
  // }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleRoleToggle = async () => {
    if (!user) return;
    const newRole = user.role === 'buyer' ? 'seller' : 'buyer';
    setRoleLoading(true);
    try {
      // Update user role in localStorage
      const updatedUser = { ...user, role: newRole };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      // Force page reload to update context
      window.location.reload();
    } catch (err) {
      alert('Failed to update role.');
    } finally {
      setRoleLoading(false);
    }
  };

  // Function to handle loading more cards
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 9);
  };

  // Function to append a new property (call this after user adds a property)
  const appendProperty = (newProperty) => {
    setProperties(prev => [...prev, newProperty]);
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">

      {/* Sidebar for logged-in users */}
      {user && (
        <aside className={`fixed top-0 left-0 h-full ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white/80 text-green-900 flex flex-col z-50 shadow-2xl rounded-r-3xl border-r-2 border-green-200/30 transition-all duration-300 backdrop-blur-xl`}>
          {/* Collapse/Expand Button */}
          <button
            className="absolute top-4 right-[-18px] z-50 bg-green-900 text-white rounded-full p-2 shadow-lg border-2 border-green-800 hover:bg-green-800 transition-all duration-200"
            onClick={() => setSidebarCollapsed(v => !v)}
            style={{ outline: 'none' }}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
          <div className={`flex flex-col items-center gap-2 p-6 border-b border-green-200/30 transition-all duration-300 ${sidebarCollapsed ? 'p-2' : ''}`}>
            <img
              src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
              alt={user.name}
              className={`rounded-full border-4 border-green-700 object-cover shadow-lg mb-2 transition-all duration-300 ${sidebarCollapsed ? 'h-8 w-8' : 'h-14 w-14'}`}
            />
            {!sidebarCollapsed && <>
              <div className="font-bold text-lg">{user.name}</div>
              <div className="text-green-700 text-xs mb-2">{user.email}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-semibold text-green-800 flex items-center gap-1">
                  {user.role === 'buyer' ? <FaUserAlt className="text-green-700" /> : <FaUserTie className="text-green-700" />}
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                <button
                  className={`ml-2 flex items-center px-2 py-1 rounded-full bg-green-800 text-white hover:bg-green-600 transition text-xs font-semibold ${roleLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={handleRoleToggle}
                  disabled={roleLoading}
                  title="Toggle role"
                >
                  <MdSwitchAccount className="mr-1" />
                  Switch to {user.role === 'buyer' ? 'Seller' : 'Buyer'}
                </button>
              </div>
            </>}
          </div>
          <nav className={`flex-1 flex flex-col gap-4 p-6 transition-all duration-300 ${sidebarCollapsed ? 'p-2 items-center gap-4' : ''}`}>
            <button title={sidebarCollapsed ? 'Dashboard' : undefined} className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl hover:bg-green-100 transition ${sidebarCollapsed ? 'justify-center px-0' : ''}`} onClick={() => navigate('/dashboard')}> <FaHome /> {!sidebarCollapsed && 'Dashboard'}</button>
            <button title={sidebarCollapsed ? 'Properties' : undefined} className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl hover:bg-green-100 transition ${sidebarCollapsed ? 'justify-center px-0' : ''}`} onClick={() => navigate('/properties')}> <FaList /> {!sidebarCollapsed && 'Properties'}</button>
            <button title={sidebarCollapsed ? 'My Properties' : undefined} className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl hover:bg-green-100 transition ${sidebarCollapsed ? 'justify-center px-0' : ''}`} onClick={() => navigate('/my-properties')}> <FaList /> {!sidebarCollapsed && 'My Properties'}</button>
            <button title={sidebarCollapsed ? 'Add Property' : undefined} className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl hover:bg-green-100 transition ${sidebarCollapsed ? 'justify-center px-0' : ''}`} onClick={() => navigate('/add-property')}> <FaPlus /> {!sidebarCollapsed && 'Add Property'}</button>
            <button title={sidebarCollapsed ? 'Messages' : undefined} className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl hover:bg-green-100 transition ${sidebarCollapsed ? 'justify-center px-0' : ''} relative`} onClick={() => navigate('/messages')}> 
              <MessageCircle /> 
              {!sidebarCollapsed && 'Messages'}
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </button>
          </nav>
          <div className={`mt-auto flex flex-col gap-2 p-6 border-t border-green-200/30 transition-all duration-300 ${sidebarCollapsed ? 'p-2 items-center' : ''}`}>
            <button title={sidebarCollapsed ? 'Settings' : undefined} className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl hover:bg-green-100 transition ${sidebarCollapsed ? 'justify-center px-0' : ''}`} onClick={() => navigate('/settings')}> <FaCog /> {!sidebarCollapsed && 'Settings'}</button>
            <button title={sidebarCollapsed ? 'Logout' : undefined} className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl hover:bg-red-100 transition ${sidebarCollapsed ? 'justify-center px-0' : ''}`} onClick={handleLogout}> <FaSignOutAlt /> {!sidebarCollapsed && 'Logout'}</button>
          </div>
        </aside>
      )}
      {/* Main content, add left margin if sidebar is open */}
      <div className={user 
        ? `${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 pt-15` 
        : 'min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 pl-12 md:pl-24 lg:pl-36 pt-20'}>
        {/* Hero Section */}
        {showHero && (
          <section className="flex flex-col md:flex-row items-center justify-between px-4 py-12 bg-transparent pt-25">
            <div className="flex-1 flex flex-col items-start justify-center text-left gap-6 mx-auto max-w-2xl pl-8 md:pl-12 lg:pl-16">
              <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 mb-2 leading-tight">
                Find Your <span style={{ color: '#3c7655', WebkitTextStroke: '1.5px #14532d', textStroke: '1.5px #14532d' }}>Perfect</span> Rental Property
              </h1>
              <p className="text-lg md:text-xl text-green-900 mb-4 max-w-xl">
                The best place to rent, list, and manage properties. Real-time chat, digital contracts, and more!
              </p>
              {/* Only show login/register if not logged in */}
              {!user && (
                <div className="flex gap-4">
                  <button
                    onClick={onLogin}
                    className="px-8 py-3 rounded-lg bg-white text-green-900 font-bold text-lg shadow hover:bg-gray-100 transition-all duration-150 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-800 relative overflow-hidden"
                    style={{ position: 'relative' }}
                  >
                    <span className="z-10 relative">Login</span>
                  </button>
                  <button
                    onClick={onRegister}
                    className="px-8 py-3 rounded-lg bg-green-800 text-white font-bold text-lg shadow hover:bg-green-700 transition-all duration-150 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-800 relative overflow-hidden"
                    style={{ position: 'relative' }}
                  >
                    <span className="z-10 relative">Register</span>
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 flex justify-center items-center mt-8 md:mt-0">
              <img
                src="https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=700&q=80"
                alt="Modern Property"
                className="w-full max-w-md rounded-2xl shadow-xl border-4 border-white object-cover"
              />
            </div>
          </section>
        )}
        {/* Search & Filter Bar */}
        <section className={`w-full py-8 px-4 border-b border-gray-200 ${!showHero ? 'pt-32' : ''}`}>
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 md:gap-4 items-center justify-between">
            <div className="flex flex-1 gap-2 w-full bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-green-100 p-0 transition-all duration-300">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-800" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none text-green-900 placeholder-green-700 text-base h-14 rounded-xl"
                  style={{ minWidth: 0 }}
                />
              </div>
            </div>
            <div className="flex flex-row gap-2 md:gap-2 search-filters">
              <select value={location} onChange={(e) => setLocation(e.target.value)} className="h-14 px-5 py-3 bg-white/70 backdrop-blur-md rounded-xl border border-green-200 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 text-base shadow-sm transition-all duration-200">
                <option value="">All Locations</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Chennai">Chennai</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Pune">Pune</option>
              </select>
              <select value={type} onChange={(e) => setType(e.target.value)} className="h-14 px-5 py-3 bg-white/70 backdrop-blur-md rounded-xl border border-green-200 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 text-base shadow-sm transition-all duration-200">
                <option value="">All Types</option>
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="House">House</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Studio">Studio</option>
              </select>
              <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="h-14 px-5 py-3 bg-white/70 backdrop-blur-md rounded-xl border border-green-200 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 text-base shadow-sm transition-all duration-200">
                <option value="">All Beds</option>
                <option value="1">1 Bed</option>
                <option value="2">2 Beds</option>
                <option value="3">3 Beds</option>
                <option value="4">4+ Beds</option>
              </select>
              <input
                type="number"
                placeholder="Min Price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="h-14 px-5 py-3 bg-white/70 backdrop-blur-md rounded-xl border border-green-200 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 text-base shadow-sm transition-all duration-200 w-28 placeholder:text-green-700"
                style={{ minWidth: 0 }}
              />
              <input
                type="number"
                placeholder="Max Price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="h-14 px-5 py-3 bg-white/70 backdrop-blur-md rounded-xl border border-green-200 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 text-base shadow-sm transition-all duration-200 w-28 placeholder:text-green-700"
                style={{ minWidth: 0 }}
              />
            </div>
          </div>
        </section>
        {/* Properties Grid */}
        <section className="w-full py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-green-900">Available Properties</h2>
              <span className="text-green-700">{filtered.length} properties found</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.slice(0, visibleCount).map((property) => (
                <div key={property.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col cursor-pointer group transition-transform duration-200 hover:shadow-2xl hover:-translate-y-1 property-card" onClick={() => navigate(`/property/${property.id}`)}>
                  <img
                    src={Array.isArray(property.images) && property.images.length > 0 ? property.images[0] : property.image}
                    alt={property.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="p-4 flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2 text-green-900 font-semibold text-xs mb-1">
                      <MapPin className="h-4 w-4" /> {property.location}
                    </div>
                    <h3 className="font-bold text-lg text-green-900 mb-1 line-clamp-2">{property.title}</h3>
                    <div className="flex gap-4 text-gray-700 text-sm mb-2">
                      <span className="flex items-center gap-1">
                        <HomeIcon className="h-4 w-4" />
                        {property.type || property.propertyType}
                      </span>
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-4 w-4" />
                        {property.bedrooms} Bed
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="h-4 w-4" />
                        {property.bathrooms} Bath
                      </span>
                    </div>
                    <div className="text-green-800 font-bold text-lg mb-2">
                      ₹{property.price?.toLocaleString?.() || property.price}
                    </div>
                    {property.rating && (
                      <div className="mb-2">
                        <StarRating rating={property.rating} reviews={property.reviews} size="sm" />
                      </div>
                    )}
                    <div className="mt-auto">
                      <button className="w-full px-4 py-2 bg-green-900 text-white font-semibold rounded-lg hover:bg-green-800 transition-all duration-150">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filtered.length > visibleCount && (
              <div className="text-center mt-8">
                <button
                  onClick={handleLoadMore}
                  className="px-8 py-3 bg-green-900 text-white font-bold rounded-lg hover:bg-green-800 transition-all duration-150"
                >
                  Load More Properties
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Landing; 