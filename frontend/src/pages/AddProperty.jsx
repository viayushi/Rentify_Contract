import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaPlus, FaCheckCircle, FaExclamationCircle, FaUpload, FaMapMarkerAlt, FaArrowLeft } from 'react-icons/fa';

const propertyTypes = [
  'Apartment', 'Villa', 'House', 'Penthouse', 'Studio', 'Row House', 'Bungalow'
];

const furnishingOptions = ['Fully Furnished', 'Semi Furnished', 'Unfurnished'];
const petPolicyOptions = ['Pets Allowed', 'No Pets'];
const amenityOptions = [
  'WiFi', 'Parking', 'Swimming Pool', 'Gym', '24x7 Security', 'Power Backup', 'Lift', 'Private Garden', 'Private Elevator', 'Home Theater', 'Concierge Service', 'CCTV', 'Clubhouse', "Children's Play Area", 'Infinity Pool'
];

function AddProperty() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    address: '',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    images: [],
    furnishing: '',
    petPolicy: '',
    amenities: [],
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef();
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);

  if (!user || user.role !== 'seller') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/80 rounded-3xl shadow-xl p-10 text-center">
          <FaExclamationCircle className="text-4xl text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">Access Denied</h2>
          <p className="text-green-800">Only sellers can add properties. Please switch to seller role in settings.</p>
        </div>
      </div>
    );
  }

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    if (name === 'amenities') {
      setForm(f => {
        if (checked) {
          return { ...f, amenities: [...f.amenities, value] };
        } else {
          return { ...f, amenities: f.amenities.filter(a => a !== value) };
        }
      });
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleFileChange = e => {
    setForm(f => ({ ...f, images: Array.from(e.target.files) }));
  };

  const handleAddressChange = async e => {
    handleChange(e);
    const value = e.target.value;
    if (value.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    setAddressLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setAddressSuggestions(data);
    } catch {
      setAddressSuggestions([]);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setForm(f => ({
      ...f,
      address: suggestion.display_name,
    }));
    setAddressSuggestions([]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Create new property object
      const newProperty = {
        id: Date.now().toString(),
        ...form,
        images: form.images.map(f => f.name || f),
        details: {
          address: form.address,
          furnishing: form.furnishing,
          petPolicy: form.petPolicy,
          amenities: form.amenities
        },
        owner: {
          id: user._id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage || ''
        },
        createdAt: new Date().toISOString(),
        location: form.address.split(',')[0] || 'Unknown Location',
        type: form.propertyType,
        rating: 0,
        reviews: 0
      };

      // Save to properties.json via backend
      const token = localStorage.getItem('token');
      await fetch('/api/property/properties-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProperty)
      });

      setSuccess('Property added successfully!');
      setTimeout(() => navigate('/my-properties'), 1500);
    } catch (err) {
      setError('Failed to add property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 pt-32">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white/80 rounded-3xl shadow-xl p-10 flex flex-col gap-6 backdrop-blur-md">
        <button type="button" onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-green-900 font-semibold hover:underline self-start">
          <FaArrowLeft className="h-5 w-5" /> Back
        </button>
        <h2 className="text-3xl font-bold text-green-900 mb-2 flex items-center gap-2"><FaPlus /> Add New Property</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input name="title" value={form.title} onChange={handleChange} required placeholder="Title" className="px-4 py-3 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-800 bg-white/70 text-green-900 shadow-sm" />
          <input name="address" value={form.address} onChange={handleChange} required placeholder="Detailed Address" className="px-4 py-3 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-800 bg-white/70 text-green-900 shadow-sm" />
          <input name="price" value={form.price} onChange={handleChange} required type="number" min="0" placeholder="Price (₹)" className="px-4 py-3 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-800 bg-white/70 text-green-900 shadow-sm" />
          <select name="propertyType" value={form.propertyType} onChange={handleChange} required className="px-4 py-3 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-800 bg-white/70 text-green-900 shadow-sm">
            <option value="">Property Type</option>
            {propertyTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <input name="bedrooms" value={form.bedrooms} onChange={handleChange} required type="number" min="0" placeholder="Bedrooms" className="px-4 py-3 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-800 bg-white/70 text-green-900 shadow-sm" />
          <input name="bathrooms" value={form.bathrooms} onChange={handleChange} required type="number" min="0" placeholder="Bathrooms" className="px-4 py-3 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-800 bg-white/70 text-green-900 shadow-sm" />
          <input name="area" value={form.area} onChange={handleChange} required type="number" min="0" placeholder="Area (sqft)" className="px-4 py-3 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-800 bg-white/70 text-green-900 shadow-sm" />
          <select name="furnishing" value={form.furnishing} onChange={handleChange} required className="px-4 py-3 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-800 bg-white/70 text-green-900 shadow-sm">
            <option value="">Furnishing</option>
            {furnishingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select name="petPolicy" value={form.petPolicy} onChange={handleChange} required className="px-4 py-3 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-800 bg-white/70 text-green-900 shadow-sm">
            <option value="">Pet Policy</option>
            {petPolicyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-green-900">Amenities</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {amenityOptions.map(opt => (
              <label key={opt} className="flex items-center gap-2">
                <input type="checkbox" name="amenities" value={opt} checked={form.amenities.includes(opt)} onChange={handleChange} />
                {opt}
              </label>
            ))}
          </div>
        </div>
        <textarea name="description" value={form.description} onChange={handleChange} required placeholder="Description" className="px-4 py-3 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-800 bg-white/70 text-green-900 shadow-sm min-h-[80px]" />
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-green-900">Images</label>
          {/* Image Preview */}
          {form.images && form.images.length > 0 && (
            <div className="flex flex-wrap gap-4 mb-2">
              {form.images.map((img, idx) => {
                let src = '';
                if (typeof img === 'string') {
                  if (img.startsWith('http') || img.startsWith('data:')) {
                    src = img;
                  } else if (img.startsWith('uploads/')) {
                    src = `/${img}`;
                  } else {
                    src = `/uploads/${img}`;
                  }
                } else {
                  src = URL.createObjectURL(img);
                }
                return <img key={idx} src={src} alt="Preview" className="h-20 w-28 object-cover rounded-lg border" />;
              })}
            </div>
          )}
          <input ref={fileInputRef} name="images" type="file" accept="image/*" multiple onChange={handleFileChange} className="rounded-lg border border-green-200 bg-white/70 text-green-900 shadow-sm" />
        </div>
        {error && <div className="flex items-center gap-2 text-red-700 bg-red-100 rounded-lg px-4 py-2"><FaExclamationCircle /> {error}</div>}
        {success && <div className="flex items-center gap-2 text-green-800 bg-green-100 rounded-lg px-4 py-2"><FaCheckCircle /> {success}</div>}
        <button type="submit" disabled={loading} className="mt-2 px-8 py-3 rounded-lg bg-green-900 text-white font-bold text-lg shadow hover:bg-green-800 transition-all duration-150 flex items-center gap-2 justify-center disabled:opacity-60 disabled:cursor-not-allowed">
          <FaPlus /> {loading ? 'Adding...' : 'Add Property'}
        </button>
      </form>
    </div>
  );
}

export default AddProperty; 