import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Home as HomeIcon, ArrowLeft, User, Mail, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import propertiesData from '../data/properties.json';
import { Wifi, LocalParking, Pool, FitnessCenter, Security, Power, Pets, Elevator, LocalLaundryService, LocalCafe, AcUnit, Tv, LocalFlorist, DirectionsCar, ChildCare, LocalBar, Restaurant, LocalGroceryStore, NoMeals, Home } from '@mui/icons-material';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=700&q=80';

function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

  useEffect(() => {
    // Find property by id from properties.json
    const prop = propertiesData.find(p => String(p.id) === String(id));
    setProperty(prop || null);
    
    // Find similar properties
    if (prop) {
      const similarProps = propertiesData
        .filter(p => p.id !== prop.id && (p.type === prop.type || p.propertyType === prop.propertyType))
        .slice(0, 3);
      setSimilar(similarProps);
    }
    setCurrentImageIndex(0);
  }, [id]);

  if (!property) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 font-bold">Property not found or failed to load from backend.</div>;
  }

  // Handle images: support both array and single image, and local uploads
  let images = [];
  if (Array.isArray(property.images) && property.images.length > 0) {
    images = property.images;
  } else if (property.image) {
    images = [property.image];
  } else {
    images = [FALLBACK_IMAGE];
  }
  // Fix image paths for all cases
  images = images.map(img => {
    if (typeof img === 'string') {
      if (img.startsWith('http') || img.startsWith('data:')) {
        return img;
      } else if (img.startsWith('uploads/')) {
        return `${API_BASE}/${img}`;
      } else if (img) {
        return `${API_BASE}/uploads/${img}`;
      }
    }
    return img;
  });

  // Seller info
  const owner = property?.owner || {};
  const sellerName = owner.name || 'Unknown Seller';
  const sellerEmail = owner.email || 'N/A';
  const sellerProfile = owner.profileImage || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(sellerName);
  const ownerId = owner.id;
  const userId = user?._id;
  // Enable chat if user is logged in and not the seller
  const canContactSeller = ownerId && userId && userId !== ownerId;
  
  // Debug logging
  console.log('PropertyDetails Debug:', {
    ownerId,
    userId,
    canContactSeller,
    user: user ? { name: user.name, email: user.email, _id: user._id } : null,
    owner: owner
  });

  const handleContactSeller = async () => {
    if (!user) {
      alert('Please login to contact the seller.');
      navigate('/login');
      return;
    }
    if (!canContactSeller) {
      alert('Cannot contact this seller.');
      return;
    }
    // Navigate to chat page with property and seller info
    navigate(`/chat/${property.id}?seller=${ownerId}`);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 pt-32">
      <div className="max-w-5xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-green-900 font-semibold mb-6 hover:underline">
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        
        {/* Image Carousel */}
        <div className="w-full mb-8 relative">
          <div className="rounded-2xl overflow-hidden shadow-xl bg-white">
            <div className="relative">
              <img 
                src={images[currentImageIndex] || FALLBACK_IMAGE} 
                alt={`Property ${currentImageIndex + 1}`} 
                className="w-full h-80 object-cover" 
                onError={e => { e.target.src = FALLBACK_IMAGE; }} 
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200"
                  >
                    <ChevronLeft className="h-6 w-6 text-green-900" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200"
                  >
                    <ChevronRight className="h-6 w-6 text-green-900" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-200 ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Thumbnails for all images */}
            {images.length > 1 && (
              <div className="flex gap-2 justify-center py-3 bg-white border-t border-gray-100">
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className={`h-16 w-24 object-cover rounded-lg cursor-pointer border-2 transition-all duration-200 ${idx === currentImageIndex ? 'border-green-700' : 'border-transparent'}`}
                    onClick={() => setCurrentImageIndex(idx)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Property Details */}
        <div className="bg-white rounded-2xl shadow-xl p-10 mb-14">
          <h1 className="text-3xl font-bold text-green-900 mb-4">{property.title}</h1>
          <div className="flex flex-wrap gap-6 text-gray-700 mb-6">
            <span className="flex items-center gap-1"><MapPin className="h-5 w-5" /> {property.location || 'N/A'}</span>
            <span className="flex items-center gap-1"><HomeIcon className="h-5 w-5" /> {property.type || property.propertyType || 'N/A'}</span>
            <span className="flex items-center gap-1"><BedDouble className="h-5 w-5" /> {property.bedrooms ?? 'N/A'} Bed</span>
            <span className="flex items-center gap-1"><Bath className="h-5 w-5" /> {property.bathrooms ?? 'N/A'} Bath</span>
            <span className="flex items-center gap-1 font-bold text-green-800 text-2xl">₹{property.price?.toLocaleString?.() || property.price || 'N/A'}</span>
            {property.area && <span className="flex items-center gap-1 text-gray-500 text-base">Area: {property.area} sqft</span>}
          </div>
          <p className="text-gray-600 text-lg mb-4">{property.description || 'No description available.'}</p>
          
          {/* Seller Info */}
          <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4 mb-6">
            <img src={sellerProfile} alt={sellerName} className="h-12 w-12 rounded-full border-2 border-green-900 object-cover" />
            <div>
              <div className="flex items-center gap-2 font-semibold text-green-900"><User className="h-4 w-4" /> {sellerName}</div>
              <div className="flex items-center gap-2 text-gray-700 text-sm"><Mail className="h-4 w-4" /> {sellerEmail}</div>
            </div>
            {user && canContactSeller ? (
              <button onClick={handleContactSeller} className="ml-auto px-5 py-2 rounded-lg bg-green-900 text-white font-semibold flex items-center gap-2 shadow hover:bg-green-800 transition-all duration-150">
                <MessageCircle className="h-5 w-5" /> Contact Seller
              </button>
            ) : !user ? (
              <button onClick={() => navigate('/login')} className="ml-auto px-5 py-2 rounded-lg bg-green-900 text-white font-semibold flex items-center gap-2 shadow hover:bg-green-800 transition-all duration-150">
                <MessageCircle className="h-5 w-5" /> Login to Contact
              </button>
            ) : (
              <span className="ml-auto px-5 py-2 rounded-lg bg-gray-300 text-gray-600 font-semibold flex items-center gap-2 cursor-not-allowed" title="You cannot contact yourself.">
                <MessageCircle className="h-5 w-5" /> Contact Seller
              </span>
            )}
          </div>
          
          {/* Property Extra Details */}
          {property.details && (
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-green-900 mb-3">Property Details</h3>
              <div className="mb-2 text-gray-700 flex items-center gap-2">
                <Home className="!text-green-800 !w-6 !h-6" />
                <span className="font-semibold">Address:</span> {property.details.address}
              </div>
              <div className="mb-2 text-gray-700 flex items-center gap-2">
                <LocalLaundryService className="!text-green-800 !w-6 !h-6" />
                <span className="font-semibold">Furnishing:</span> {property.details.furnishing}
              </div>
              <div className="mb-2 text-gray-700 flex items-center gap-2">
                {property.details.petPolicy === 'Pets Allowed' ? (
                  <Pets className="!text-green-800 !w-6 !h-6" />
                ) : (
                  <Pets className="!text-red-600 !w-6 !h-6 opacity-60" title="No Pets Allowed" />
                )}
                <span className="font-semibold">Pet Policy:</span> {property.details.petPolicy}
              </div>
              <div className="mt-4">
                <div className="font-semibold text-green-900 mb-2 flex items-center gap-2"><span>Amenities:</span></div>
                <div className="flex flex-wrap gap-4">
                  {property.details.amenities && property.details.amenities.map((amenity, idx) => {
                    // Map amenity string to icon
                    const iconMap = {
                      'WiFi': <Wifi className="!text-green-700 !w-6 !h-6" />, 'Parking': <LocalParking className="!text-green-700 !w-6 !h-6" />, 'Swimming Pool': <Pool className="!text-green-700 !w-6 !h-6" />, 'Gym': <FitnessCenter className="!text-green-700 !w-6 !h-6" />, '24x7 Security': <Security className="!text-green-700 !w-6 !h-6" />, 'Power Backup': <Power className="!text-green-700 !w-6 !h-6" />, 'Pets Allowed': <Pets className="!text-green-700 !w-6 !h-6" />, 'Lift': <Elevator className="!text-green-700 !w-6 !h-6" />, 'Private Garden': <LocalFlorist className="!text-green-700 !w-6 !h-6" />, 'Private Elevator': <Elevator className="!text-green-700 !w-6 !h-6" />, 'Home Theater': <Tv className="!text-green-700 !w-6 !h-6" />, 'Concierge Service': <User className="!text-green-700 !w-6 !h-6" />, 'CCTV': <Security className="!text-green-700 !w-6 !h-6" />, 'Clubhouse': <LocalBar className="!text-green-700 !w-6 !h-6" />, "Children's Play Area": <ChildCare className="!text-green-700 !w-6 !h-6" />, 'Infinity Pool': <Pool className="!text-green-700 !w-6 !h-6" />
                    };
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow border border-gray-100">
                        {iconMap[amenity] || <HomeIcon className="!text-green-700 !w-6 !h-6" />}<span className="text-gray-800 text-sm">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Similar Properties */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-green-900 mb-6">Similar Properties</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {similar.map((p) => (
              <div key={p.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col cursor-pointer group transition-transform duration-200 hover:shadow-2xl hover:-translate-y-1 property-card">
                <img src={Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : p.image} alt={p.title} className="w-full h-32 object-cover" />
                <div className="p-4 flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2 text-green-900 font-semibold text-xs mb-1">
                    <MapPin className="h-4 w-4" /> {p.location}
                  </div>
                  <h3 className="font-bold text-base text-green-900 mb-1 line-clamp-2">{p.title}</h3>
                  <div className="flex gap-2 text-gray-700 text-xs mb-1">
                    <span className="flex items-center gap-1"><HomeIcon className="h-4 w-4" />{p.type}</span>
                    <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" />{p.bedrooms} Bed</span>
                  </div>
                  <div className="text-green-800 font-bold text-base mb-1">₹{p.price?.toLocaleString?.() || p.price}</div>
                  <button onClick={() => navigate(`/property/${p.id}`)} className="mt-1 px-3 py-1 rounded bg-green-900 text-white text-xs font-semibold hover:bg-green-800 transition">View Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertyDetails; 