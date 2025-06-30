import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPropertyById } from '../store/slices/propertySlice';
import { createOrder } from '../store/slices/orderSlice';
import { sendMessage } from '../store/slices/messageSlice';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const propertyState = useSelector((state) => state.property || {});
  const { selectedProperty, loading, error } = propertyState;
  const { user } = useSelector((state) => state.auth);
  const { loading: messageLoading } = useSelector((state) => state.message);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: ''
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchPropertyById(id));
    }
  }, [dispatch, id]);

  const handleImageChange = (index) => {
    setCurrentImageIndex(index);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: `/properties/${id}` } });
      return;
    }

    try {
      await dispatch(sendMessage({
        recipientId: selectedProperty.owner?._id,
        propertyId: selectedProperty._id,
        subject: contactForm.subject,
        message: contactForm.message
      })).unwrap();
      setContactForm({ subject: '', message: '' });
      setShowContactForm(false);
      alert('Message sent successfully!');
    } catch (error) {
      alert('Failed to send message. Please try again.');
    }
  };

  const handleBookProperty = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/properties/${id}` } });
      return;
    }

    try {
      await dispatch(createOrder({
        propertyId: selectedProperty._id,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      })).unwrap();
      
      navigate('/orders');
    } catch (error) {
      alert('Failed to create booking. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !selectedProperty) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error ? error : 'Property not found or you are not authorized.'}</h2>
          <button
            onClick={() => navigate('/properties')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <button onClick={() => navigate('/')} className="hover:text-indigo-600">
                Home
              </button>
            </li>
            <li>/</li>
            <li>
              <button onClick={() => navigate('/properties')} className="hover:text-indigo-600">
                Properties
              </button>
            </li>
            <li>/</li>
            <li className="text-gray-900">{selectedProperty.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div className="relative h-96 bg-gray-200">
                {selectedProperty.images && selectedProperty.images.length > 0 ? (
                  <img
                    src={selectedProperty.images[currentImageIndex]}
                    alt={selectedProperty.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                {/* Image Navigation */}
                {selectedProperty.images && selectedProperty.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev === 0 ? selectedProperty.images.length - 1 : prev - 1)}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev === selectedProperty.images.length - 1 ? 0 : prev + 1)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Navigation */}
              {selectedProperty.images && selectedProperty.images.length > 1 && (
                <div className="p-4 flex space-x-2 overflow-x-auto">
                  {selectedProperty.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => handleImageChange(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                        currentImageIndex === index ? 'border-indigo-600' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${selectedProperty.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {selectedProperty.title}
                  </h1>
                  <p className="text-gray-600 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {selectedProperty.location ? `${selectedProperty.location.address || ''}${selectedProperty.location.city ? ', ' + selectedProperty.location.city : ''}${selectedProperty.location.state ? ', ' + selectedProperty.location.state : ''}${selectedProperty.location.zipCode ? ', ' + selectedProperty.location.zipCode : ''}${selectedProperty.location.country ? ', ' + selectedProperty.location.country : ''}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-indigo-600">
                    ${selectedProperty.price}
                  </div>
                  <div className="text-gray-500">per month</div>
                </div>
              </div>

              {/* Property Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{selectedProperty.bedrooms}</div>
                  <div className="text-gray-500">Bedrooms</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{selectedProperty.bathrooms}</div>
                  <div className="text-gray-500">Bathrooms</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{selectedProperty.area}</div>
                  <div className="text-gray-500">sq ft</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{selectedProperty.propertyType}</div>
                  <div className="text-gray-500">Type</div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {selectedProperty.description}
                </p>
              </div>

              {/* Amenities */}
              {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedProperty.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Property Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    selectedProperty.status === 'available' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-gray-700">
                    {selectedProperty.status === 'available' ? 'Available for rent' : 'Currently rented'}
                  </span>
                </div>
                {selectedProperty.verified && (
                  <div className="flex items-center text-green-600">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified Property
                  </div>
                )}
              </div>
            </div>

            {/* Owner Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Owner</h3>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-indigo-600 font-semibold">
                    {selectedProperty.owner?.firstName?.charAt(0)}{selectedProperty.owner?.lastName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedProperty.owner?.firstName} {selectedProperty.owner?.lastName}
                  </div>
                  <div className="text-gray-500">Property Owner</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Booking Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-indigo-600 mb-1">
                  ${selectedProperty.price}
                </div>
                <div className="text-gray-500">per month</div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleBookProperty}
                  disabled={selectedProperty.status !== 'available'}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {selectedProperty.status === 'available' ? 'Book Now' : 'Currently Rented'}
                </button>

                <button
                  onClick={() => setShowContactForm(!showContactForm)}
                  className="w-full border border-indigo-600 text-indigo-600 py-3 px-4 rounded-md hover:bg-indigo-50 transition-colors font-medium"
                >
                  Contact Owner
                </button>
              </div>

              {/* Contact Form */}
              {showContactForm && (
                <form onSubmit={handleContactSubmit} className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Subject"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message
                      </label>
                      <textarea
                        value={contactForm.message}
                        onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Your message..."
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={messageLoading}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {messageLoading ? <LoadingSpinner size="sm" /> : 'Send Message'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Property Highlights */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Highlights</h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {selectedProperty.bedrooms} Bedrooms
                </div>
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {selectedProperty.bathrooms} Bathrooms
                </div>
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {selectedProperty.area} sq ft
                </div>
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {selectedProperty.propertyType}
                </div>
                {selectedProperty.verified && (
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified Property
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage; 