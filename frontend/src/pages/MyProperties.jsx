import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import propertiesData from "../data/properties.json";
import { Edit, Trash2, MessageCircle, MapPin, Home, BedDouble, Bath, ArrowLeft } from "lucide-react";
import StarRating from "../components/StarRating";

const MyProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const userProperties = propertiesData.filter(p => p.owner && p.owner.id === user._id);
      setProperties(userProperties);
    }
    setLoading(false);
  }, [user]);

  const handleEdit = (propertyId) => {
    navigate(`/edit-property/${propertyId}`);
  };

  const handleDelete = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        // Remove from properties.json via backend
        await fetch(`/api/property/delete/${propertyId}`, {
          method: 'DELETE'
        });
        // Update local state
        setProperties(prev => prev.filter(p => p.id !== propertyId));
        alert('Property deleted successfully!');
      } catch (error) {
        alert('Failed to delete property');
      }
    }
  };

  const handleContactSeller = (property) => {
    // Navigate to chat with the property owner
    navigate(`/chat/${property.id}?seller=${property.owner.id}`);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-green-900 text-lg">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 p-8 pt-32">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 flex items-center gap-2 text-green-900 font-semibold hover:underline"
        >
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-green-900">My Properties</h1>
          <button
            onClick={() => navigate('/add-property')}
            className="px-6 py-3 bg-green-900 text-white rounded-lg font-semibold hover:bg-green-800 transition-all duration-150"
          >
            Add New Property
          </button>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-green-700 text-xl mb-4">No properties listed yet</div>
            <p className="text-gray-600 mb-6">Start by adding your first property!</p>
            <button
              onClick={() => navigate('/add-property')}
              className="px-6 py-3 bg-green-900 text-white rounded-lg font-semibold hover:bg-green-800 transition-all duration-150"
            >
              Add Property
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <img
                  src={Array.isArray(property.images) && property.images.length > 0 ? property.images[0] : property.image}
                  alt={property.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center gap-2 text-green-900 font-semibold text-xs mb-2">
                    <MapPin className="h-4 w-4" />
                    {property.location}
                  </div>
                  <h3 className="font-bold text-lg text-green-900 mb-2 line-clamp-2">{property.title}</h3>
                  <div className="flex gap-4 text-gray-700 text-sm mb-2">
                    <span className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
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
                    <div className="mb-3">
                      <StarRating rating={property.rating} reviews={property.reviews} size="sm" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(property.id)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition flex items-center justify-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(property.id)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 transition flex items-center justify-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                  <button
                    onClick={() => handleContactSeller(property)}
                    className="w-full mt-2 px-3 py-2 bg-green-900 text-white text-sm font-semibold rounded hover:bg-green-800 transition flex items-center justify-center gap-1"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contact Seller
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProperties; 