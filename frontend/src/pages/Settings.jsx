import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaCog, FaUser, FaEnvelope, FaPhone, FaImage, FaTrash, FaMapMarkerAlt, FaExchangeAlt, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import SignaturePadWrapper from 'react-signature-pad-wrapper';

function Settings() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', address: '', profileImage: '', role: 'buyer' });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [hasStoredSignature, setHasStoredSignature] = useState(false);
  const [storedSignature, setStoredSignature] = useState(null);
  const [signatureStatusLoading, setSignatureStatusLoading] = useState(true);
  const [signaturePadRef, setSignaturePadRef] = useState(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        profileImage: user.profileImage || '',
        role: user.role || 'buyer',
      });
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const checkSignatureStatus = async () => {
      try {
        setSignatureStatusLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('No token found, skipping signature status check');
          setHasStoredSignature(false);
          setSignatureStatusLoading(false);
          return;
        }
        
        const response = await axios.get('http://localhost:5000/api/user/signature', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHasStoredSignature(response.data.hasSignature);
        setStoredSignature(response.data.signature);
      } catch (error) {
        console.error('Error checking signature status:', error);
        // Don't break the component if signature check fails
        setHasStoredSignature(false);
        setStoredSignature(null);
      } finally {
        setSignatureStatusLoading(false);
      }
    };

    if (user) {
      checkSignatureStatus();
    }
  }, [user]);

  const handleProfileChange = e => {
    const { name, value } = e.target;
    setProfile(p => ({ ...p, [name]: value }));
  };

  const handleProfileSubmit = async e => {
    e.preventDefault();
    setProfileSuccess(''); 
    setProfileError('');
    try {
      // Update user in localStorage
      const updatedUser = { ...user, ...profile };
      updateUser(updatedUser);
      setProfileSuccess('Profile updated!');
      setTimeout(() => setProfileSuccess(''), 2000);
    } catch (err) {
      setProfileError('Failed to update profile.');
      setTimeout(() => setProfileError(''), 2000);
    }
  };

  const handleProfileImageChange = e => {
    setProfileImageFile(e.target.files[0]);
  };

  const handleProfileImageUpload = async e => {
    e.preventDefault();
    if (!profileImageFile) return;
    try {
      // Create a local URL for the image
      const imageUrl = URL.createObjectURL(profileImageFile);
      setProfile(p => ({ ...p, profileImage: imageUrl }));
      updateUser({ ...user, profileImage: imageUrl });
      setProfileSuccess('Profile image updated!');
      setTimeout(() => setProfileSuccess(''), 2000);
    } catch {
      setProfileError('Failed to upload image.');
      setTimeout(() => setProfileError(''), 2000);
    }
  };

  const handleRoleSwitch = async () => {
    const newRole = profile.role === 'buyer' ? 'seller' : 'buyer';
    try {
      setProfile(p => ({ ...p, role: newRole }));
      updateUser({ ...user, role: newRole });
      setProfileSuccess('Role switched!');
      setTimeout(() => setProfileSuccess(''), 2000);
    } catch {
      setProfileError('Failed to switch role.');
      setTimeout(() => setProfileError(''), 2000);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    try {
      logout();
      alert('Account deleted successfully!');
    } catch {
      alert('Failed to delete account.');
    }
  };

  const handleSaveSignatureToProfile = async () => {
    if (!signaturePadRef || signaturePadRef.isEmpty()) {
      alert('Please provide your signature first.');
      return;
    }

    try {
      setLoading(true);
      const signatureImage = signaturePadRef.toDataURL();
      const token = localStorage.getItem('token');
      
      await axios.post('http://localhost:5000/api/user/signature', {
        signatureImage: signatureImage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setHasStoredSignature(true);
      setStoredSignature(signatureImage);
      setMessage('Signature saved successfully!');
      setShowSignaturePad(false);
      if (signaturePadRef) signaturePadRef.clear();
    } catch (error) {
      console.error('Error saving signature:', error);
      setMessage('Failed to save signature. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSignature = () => {
    if (signaturePadRef) {
      signaturePadRef.clear();
    }
  };

  const handleDeleteSignature = async () => {
    if (!confirm('Are you sure you want to delete your stored signature?')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.delete('http://localhost:5000/api/user/signature', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setHasStoredSignature(false);
      setStoredSignature(null);
      setMessage('Signature deleted successfully!');
    } catch (error) {
      console.error('Error deleting signature:', error);
      setMessage('Failed to delete signature. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) return <div className="min-h-screen flex items-center justify-center text-green-900 text-lg animate-pulse">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-white to-green-200 p-4">
      <form onSubmit={handleProfileSubmit} className="w-full max-w-xl bg-white/90 rounded-3xl shadow-2xl p-10 flex flex-col gap-8 border border-green-200 animate-fade-in">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-4 flex items-center gap-2 text-green-900 font-semibold hover:underline self-start"
        >
          <FaArrowLeft className="h-5 w-5" /> Back
        </button>
        <h2 className="text-4xl font-extrabold text-green-900 mb-4 flex items-center gap-3"><FaCog className="text-green-700" /> Profile Settings</h2>
        {/* Profile Picture */}
        <div className="flex flex-col items-center gap-2">
          <img src={profileImageFile ? URL.createObjectURL(profileImageFile) : (profile.profileImage ? (profile.profileImage.startsWith('http') ? profile.profileImage : `/${profile.profileImage}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}`)} alt="Profile" className="h-24 w-24 object-cover rounded-full border-2 border-green-700 shadow" />
          <button type="button" onClick={() => document.getElementById('profileImageInput').click()} className="text-green-800 underline text-sm mt-2 flex items-center gap-1"><FaImage /> Change profile image</button>
          <input id="profileImageInput" type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" aria-label="Upload profile image" />
          {profileImageFile && <button onClick={handleProfileImageUpload} className="mt-2 px-4 py-1 bg-green-700 text-white rounded shadow">Upload</button>}
        </div>
        {/* Profile Details */}
        <div className="flex flex-col gap-4 w-full">
          <label className="flex items-center gap-2"><FaUser /> <input name="name" value={profile.name} onChange={handleProfileChange} className="flex-1 px-3 py-2 rounded border border-green-200" placeholder="Name" aria-label="Name" /></label>
          <label className="flex items-center gap-2"><FaEnvelope /> <input name="email" value={profile.email} onChange={handleProfileChange} className="flex-1 px-3 py-2 rounded border border-green-200" placeholder="Email" aria-label="Email" /></label>
          <label className="flex items-center gap-2"><FaPhone /> <input name="phone" value={profile.phone} onChange={handleProfileChange} className="flex-1 px-3 py-2 rounded border border-green-200" placeholder="Phone" aria-label="Phone" /></label>
          <label className="flex items-center gap-2"><FaMapMarkerAlt /> <input name="address" value={profile.address} onChange={handleProfileChange} className="flex-1 px-3 py-2 rounded border border-green-200" placeholder="Address" aria-label="Address" /></label>
        </div>
        {/* Role Switch */}
        <div className="flex items-center gap-4 mt-2">
          <span className="font-semibold text-green-900">Role:</span>
          <button type="button" onClick={handleRoleSwitch} className={`px-4 py-2 rounded-lg font-bold shadow transition-all duration-150 flex items-center gap-2 ${profile.role === 'buyer' ? 'bg-green-800 text-white' : 'bg-white border border-green-800 text-green-800'}`}><FaExchangeAlt /> {profile.role === 'buyer' ? 'Buyer' : 'Seller'}</button>
        </div>
        {/* Signature Management */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-green-900 mb-6">Digital Signature</h2>
          
          {signatureStatusLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-900 mx-auto mb-4"></div>
              <div className="text-gray-600">Loading signature status...</div>
            </div>
          ) : hasStoredSignature ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-green-600">✓</span>
                  <span className="font-semibold text-green-800">Stored Signature Available</span>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  Your signature is saved and ready to use for signing contracts.
                </p>
                {storedSignature && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Signature:</label>
                    <img src={storedSignature} alt="Stored Signature" className="h-16 border border-gray-300 rounded bg-white" />
                  </div>
                )}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSignaturePad(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Update Signature
                  </button>
                  <button
                    onClick={handleDeleteSignature}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete Signature'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-orange-600">⚠</span>
                  <span className="font-semibold text-orange-800">No Stored Signature</span>
                </div>
                <p className="text-sm text-orange-700 mb-3">
                  Create a digital signature to speed up contract signing.
                </p>
                <button
                  onClick={() => setShowSignaturePad(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                >
                  Create Signature
                </button>
              </div>
            </div>
          )}

          {/* Signature Pad */}
          {showSignaturePad && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">Digital Signature</h3>
              <div className="space-y-3">
                <SignaturePadWrapper
                  ref={setSignaturePadRef}
                  options={{
                    minWidth: 2,
                    maxWidth: 4,
                    penColor: '#14532d',
                    backgroundColor: '#fff'
                  }}
                  className="border-2 border-green-300 rounded-xl w-full h-32 mb-2"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleClearSignature}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleSaveSignatureToProfile}
                    disabled={loading}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Signature'}
                  </button>
                  <button
                    onClick={() => setShowSignaturePad(false)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Save & Delete */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mt-6">
          <button type="submit" className="px-8 py-3 rounded-lg bg-gradient-to-r from-green-800 to-green-600 text-white font-bold text-lg shadow-lg hover:scale-105 hover:from-green-900 hover:to-green-700 transition-all duration-200 flex items-center gap-2 justify-center disabled:opacity-60 disabled:cursor-not-allowed">
            Save Changes
          </button>
          <button type="button" onClick={handleDeleteAccount} className="flex items-center gap-2 px-6 py-2 rounded bg-red-700 text-white font-bold shadow hover:bg-red-800 transition-all duration-150"><FaTrash /> Delete Account</button>
        </div>
        {profileError && <div className="flex items-center gap-2 text-red-700 bg-red-100 rounded-lg px-4 py-2">{profileError}</div>}
        {profileSuccess && <div className="flex items-center gap-2 text-green-800 bg-green-100 rounded-lg px-4 py-2">{profileSuccess}</div>}
        {message && (
          <div className={`mt-6 p-4 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

export default Settings; 