import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchMyProperties, deleteProperty } from '../store/slices/propertySlice';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import PropertyCard from '../components/UI/PropertyCard';

const MyPropertiesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myProperties, loading, error } = useSelector((state) => state.properties);

  const [filter, setFilter] = useState('all'); // all, available, rented
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchMyProperties());
  }, [dispatch]);

  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      try {
        await dispatch(deleteProperty(propertyId)).unwrap();
        dispatch(fetchMyProperties()); // Refresh the list
      } catch (error) {
        console.error('Failed to delete property:', error);
      }
    }
  };

  const filteredProperties = myProperties.filter(property => {
    const matchesFilter = filter === 'all' || property.status === filter;
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (property.location && property.location.address && property.location.address.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    // If error is 401 Unauthorized, show login prompt
    if (typeof error === 'string' && error.toLowerCase().includes('unauthorized')) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You are not authorized. Please log in.</h2>
            <button
              onClick={() => navigate('/login')}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }
    // Other errors
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>
              <p className="text-gray-600">Manage your rental properties</p>
            </div>
            <Link
              to="/add-property"
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Add Property
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <select
                  id="filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Properties</option>
                  <option value="available">Available</option>
                  <option value="rented">Rented</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Properties
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by title or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm || filter !== 'all' ? 'No properties found' : 'No properties yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search criteria.'
                : 'Get started by adding your first property.'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <div className="mt-6">
                <Link
                  to="/add-property"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Property
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => (
              <PropertyCard 
                key={property.id || property._id} 
                property={property} 
                variant="owner"
                onDelete={handleDeleteProperty}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        {myProperties.length > 0 && (
          <div className="mt-12 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Property Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{myProperties.length}</div>
                <div className="text-gray-500">Total Properties</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {myProperties.filter(p => p.status === 'available').length}
                </div>
                <div className="text-gray-500">Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {myProperties.filter(p => p.status === 'rented').length}
                </div>
                <div className="text-gray-500">Rented</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {myProperties.filter(p => p.status === 'pending').length}
                </div>
                <div className="text-gray-500">Pending</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPropertiesPage; 