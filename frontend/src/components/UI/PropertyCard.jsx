import React from 'react';
import { Link } from 'react-router-dom';

const PropertyCard = ({ 
  property, 
  variant = 'default', // 'default', 'owner', 'featured'
  onDelete,
  showActions = true 
}) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { color: 'bg-green-100 text-green-800', text: 'Available' },
      rented: { color: 'bg-red-100 text-red-800', text: 'Rented' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' }
    };
    
    const config = statusConfig[status] || statusConfig.available;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const renderActions = () => {
    if (!showActions) return null;
    const propertyId = property._id || property.id;
    return (
      <div className="flex space-x-2 mt-4">
        {variant === 'owner' && (
          <Link
            to={propertyId ? `/my-properties/${propertyId}` : '#'}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
            onClick={e => { if (!propertyId) e.preventDefault(); }}
          >
            View
          </Link>
        )}
        {variant !== 'owner' && (
          <Link
            to={propertyId ? `/properties/${propertyId}` : '#'}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
            onClick={e => { if (!propertyId) e.preventDefault(); }}
          >
            View
          </Link>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(propertyId)}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 bg-gray-200">
        {property.images && property.images[0] ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        
        {/* Price Badge */}
        <div className="absolute top-4 right-4 bg-indigo-600 text-white px-2 py-1 rounded text-sm font-medium">
          ${property.price}/month
        </div>
        
        {/* Status Badge for owner variant */}
        {variant === 'owner' && (
          <div className="absolute top-4 left-4">
            {getStatusBadge(property.status)}
          </div>
        )}
        
        {/* Verified Badge */}
        {property.verified && (
          <div className="absolute top-4 left-4 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
            Verified
          </div>
        )}
        
        {/* Featured Badge */}
        {variant === 'featured' && (
          <div className="absolute top-4 left-4 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
            Featured
          </div>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {property.title}
        </h3>
        <p className="text-gray-600 mb-4 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {property.location ? `${property.location.address || ''}${property.location.city ? ', ' + property.location.city : ''}${property.location.state ? ', ' + property.location.state : ''}${property.location.zipCode ? ', ' + property.location.zipCode : ''}${property.location.country ? ', ' + property.location.country : ''}` : ''}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>{property.bedrooms} beds</span>
          <span>{property.bathrooms} baths</span>
          <span>{property.area} sq ft</span>
        </div>
        
        {/* Description for default variant */}
        {variant === 'default' && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {property.description}
          </p>
        )}
        
        {/* Price display for owner variant */}
        {variant === 'owner' && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-indigo-600">
              ${property.price}
            </span>
            <span className="text-gray-500">/month</span>
          </div>
        )}
        
        {renderActions()}
      </div>
    </div>
  );
};

export default PropertyCard; 