import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import propertiesData from "../data/properties.json";
import { FaPlus, FaCheckCircle, FaExclamationCircle, FaUpload, FaMapMarkerAlt, FaArrowLeft } from 'react-icons/fa';

const propertyTypes = [
  'Apartment', 'Villa', 'House', 'Penthouse', 'Studio', 'Row House', 'Bungalow'
];

const furnishingOptions = ['Fully Furnished', 'Semi Furnished', 'Unfurnished'];
const petPolicyOptions = ['Pets Allowed', 'No Pets'];
const amenityOptions = [
  'WiFi', 'Parking', 'Swimming Pool', 'Gym', '24x7 Security', 'Power Backup', 'Lift', 'Private Garden', 'Private Elevator', 'Home Theater', 'Concierge Service', 'CCTV', 'Clubhouse', "Children's Play Area", 'Infinity Pool'
];

function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  useEffect(() => {
    // Find property by id
    const foundProperty = propertiesData.find(p => String(p.id) === String(id));
    if (foundProperty) {
      setProperty(foundProperty);
      setForm({
        title: foundProperty.title || '',
        description: foundProperty.description || '',
        price: foundProperty.price || '',
        address: foundProperty.address || '',
        propertyType: foundProperty.propertyType || foundProperty.type || '',
        bedrooms: foundProperty.bedrooms || '',
        bathrooms: foundProperty.bathrooms || '',
        area: foundProperty.area || '',
        images: foundProperty.images || [],
        furnishing: foundProperty.furnishing || '',
        petPolicy: foundProperty.petPolicy || '',
        amenities: foundProperty.amenities || [],
      });
    }
    setLoading(false);
  }, [id]);

  if (!user || user.role !== 'seller') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/80 rounded-3xl shadow-xl p-10 text-center">
          <FaExclamationCircle className="text-4xl text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">Access Denied</h2>
          <p className="text-green-800">Only sellers can edit properties. Please switch to seller role in the sidebar.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-green-900 text-lg">Loading...</div>;
  }

  if (!property) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 font-bold">Property not found.</div>;
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

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // Update property in properties.json via backend
      const updatedProperty = {
        ...property,
        ...form,
        images: form.images.map(f => f.name || f),
        details: {
          address: form.address,
          furnishing: form.furnishing,
          petPolicy: form.petPolicy,
          amenities: form.amenities
        }
      };
      
      await fetch(`/api/property/update/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProperty)
      });
      
      setSuccess('Property updated successfully!');
      setTimeout(() => navigate('/my-properties'), 1500);
    } catch (err) {
      setError('Failed to update property.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 pt-32">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white/80 rounded-3xl shadow-xl p-10 flex flex-col gap-6 backdrop-blur-md">
        <button type="button" onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-green-900 font-semibold hover:underline self-start">
          <FaArrowLeft className="h-5 w-5" /> Back
        </button>
        <h2 className="text-3xl font-bold text-green-900 mb-2 flex items-center gap-2"><FaPlus /> Edit Property</h2>
        
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
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800 transition-all duration-150 flex items-center gap-2 justify-center"
          >
            <FaUpload /> Upload Images
          </button>
          {form.images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.images.map((img, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={typeof img === 'string' ? img : URL.createObjectURL(img)}
                    alt={`Property ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {error && <div className="text-red-600 text-center">{error}</div>}
        {success && <div className="text-green-600 text-center">{success}</div>}
        
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-green-900 text-white font-bold text-lg shadow hover:bg-green-800 transition-all duration-150"
          disabled={saving}
        >
          {saving ? 'Updating...' : 'Update Property'}
        </button>
      </form>
    </div>
  );
}

export default EditProperty; 