import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, BedDouble, Bath, Home as HomeIcon, ArrowLeft } from 'lucide-react';
import propertiesData from '../data/properties.json';

function Properties() {
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setProperties(propertiesData);
  }, []);

  // Filter properties by search and filters
  const filtered = properties.filter(p => {
    const title = p.title || '';
    const loc = p.location || '';
    const propertyType = p.propertyType || p.type || '';
    const beds = p.bedrooms || 0;
    const price = p.price || 0;
    
    const matchesSearch = search === '' || 
      title.toLowerCase().includes(search.toLowerCase()) ||
      loc.toLowerCase().includes(search.toLowerCase()) ||
      propertyType.toLowerCase().includes(search.toLowerCase());
    
    const matchesLocation = location === '' || loc.toLowerCase().includes(location.toLowerCase());
    const matchesType = type === '' || propertyType === type;
    const matchesBedrooms = bedrooms === '' || beds === Number(bedrooms);
    const matchesMinPrice = minPrice === '' || price >= Number(minPrice);
    const matchesMaxPrice = maxPrice === '' || price <= Number(maxPrice);
    
    return matchesSearch && matchesLocation && matchesType && matchesBedrooms && matchesMinPrice && matchesMaxPrice;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 pt-32">
      <div className="max-w-6xl mx-auto px-4">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 flex items-center gap-2 text-green-900 font-semibold hover:underline"
        >
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        <h1 className="text-4xl font-bold text-green-900 mb-8">All Properties</h1>
        
        {/* Search and Filter Bar */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-green-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-green-800" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search properties..."
                className="w-full pl-10 pr-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 text-green-900"
              />
            </div>
            <select
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="px-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 text-green-900"
            >
              <option value="">All Locations</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Chennai">Chennai</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Pune">Pune</option>
            </select>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="px-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 text-green-900"
            >
              <option value="">All Types</option>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="House">House</option>
              <option value="Penthouse">Penthouse</option>
              <option value="Studio">Studio</option>
            </select>
            <select
              value={bedrooms}
              onChange={e => setBedrooms(e.target.value)}
              className="px-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 text-green-900"
            >
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
              onChange={e => setMinPrice(e.target.value)}
              className="px-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 text-green-900"
            />
            <input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="px-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 text-green-900"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-green-700 font-semibold">{filtered.length} properties found</span>
        </div>

        {/* Properties Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-green-700 text-xl mb-4">No properties found</div>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(property => (
              <div
                key={property.id}
                className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col cursor-pointer group transition-transform duration-200 hover:shadow-2xl hover:-translate-y-1"
                onClick={() => navigate(`/property/${property.id}`)}
              >
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
                  <div className="mt-auto">
                    <button className="w-full px-4 py-2 bg-green-900 text-white font-semibold rounded-lg hover:bg-green-800 transition-all duration-150">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Properties; 