import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPropertyById } from '../store/slices/propertySlice';

const MyPropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedProperty, loading } = useSelector((state) => state.properties);
  const [showContact, setShowContact] = useState(false);
  const [contactMsg, setContactMsg] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchPropertyById(id));
    }
  }, [dispatch, id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!selectedProperty) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property not found</h2>
          <button
            onClick={() => navigate('/my-properties')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Back to My Properties
          </button>
        </div>
      </div>
    );
  }

  const seller = selectedProperty.sellerId || selectedProperty.seller;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="mb-4 text-indigo-600 hover:underline">&larr; Back</button>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              {selectedProperty.images && selectedProperty.images[0] && (
                <img src={selectedProperty.images[0]} alt={selectedProperty.title} className="w-full h-64 object-cover rounded mb-4" />
              )}
              <h1 className="text-2xl font-bold mb-2">{selectedProperty.title}</h1>
              <p className="text-gray-600 mb-2">{selectedProperty.description}</p>
              <div className="mb-2">
                <span className="font-semibold">Location:</span> {selectedProperty.location ? `${selectedProperty.location.address || ''}${selectedProperty.location.city ? ', ' + selectedProperty.location.city : ''}${selectedProperty.location.state ? ', ' + selectedProperty.location.state : ''}${selectedProperty.location.zipCode ? ', ' + selectedProperty.location.zipCode : ''}${selectedProperty.location.country ? ', ' + selectedProperty.location.country : ''}` : ''}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Price:</span> ${selectedProperty.price}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Bedrooms:</span> {selectedProperty.bedrooms} | <span className="font-semibold">Bathrooms:</span> {selectedProperty.bathrooms}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Area:</span> {selectedProperty.area} sq ft
              </div>
              <div className="mb-2">
                <span className="font-semibold">Amenities:</span> {selectedProperty.amenities?.join(', ')}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Status:</span> {selectedProperty.status}
              </div>
            </div>
            <div className="w-full md:w-72 flex-shrink-0">
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold mb-2">Seller Info</h3>
                {seller ? (
                  <div className="flex items-center gap-3 mb-2">
                    <img src={seller.profileImage || '/placeholder-user.png'} alt={seller.name || seller.firstName} className="w-12 h-12 rounded-full" />
                    <div>
                      <div className="font-medium">{seller.name || (seller.firstName + ' ' + seller.lastName)}</div>
                      <div className="text-sm text-gray-500">{seller.email}</div>
                    </div>
                  </div>
                ) : <div className="text-gray-500">No seller info</div>}
                <button
                  className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 mt-2"
                  onClick={() => setShowContact(true)}
                >
                  Contact Seller
                </button>
              </div>
              {showContact && (
                <div className="bg-white border rounded-lg p-4 shadow">
                  <h4 className="font-semibold mb-2">Send a message to the seller</h4>
                  {sent ? (
                    <div className="text-green-600 font-medium">Message sent!</div>
                  ) : (
                    <form onSubmit={e => { e.preventDefault(); setSent(true); }}>
                      <textarea
                        className="w-full border rounded p-2 mb-2"
                        rows={3}
                        placeholder="Type your message..."
                        value={contactMsg}
                        onChange={e => setContactMsg(e.target.value)}
                        required
                      />
                      <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">Send</button>
                      <button type="button" className="w-full mt-2 text-gray-500 hover:underline" onClick={() => setShowContact(false)}>Cancel</button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPropertyDetailPage; 