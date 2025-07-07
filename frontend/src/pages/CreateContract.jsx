import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, DollarSign, User, Home, Download, Eye, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import SignaturePadWrapper from 'react-signature-pad-wrapper';

const API_BASE = 'http://localhost:5000';

const CreateContract = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [createdContract, setCreatedContract] = useState(null);
  
  // Contract form state
  const [contractData, setContractData] = useState({
    startDate: '',
    endDate: '',
    monthlyRent: '',
    securityDeposit: '',
    terms: '',
    conditions: '',
    propertyAddress: '',
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    tenantAddress: '',
    landlordName: '',
    landlordEmail: '',
    landlordPhone: '',
    landlordAddress: '',
    contractId: '',
    placeOfExecution: '',
    witnessName: '',
    witnessAddress: '',
    bedrooms: '',
    fans: '',
    lights: '',
    geysers: '',
    mirrors: '',
    taps: '',
    maintenanceCharges: '',
    landlordFatherName: '',
    tenantFatherName: '',
    tenantOccupation: ''
  });

  const [signatureData, setSignatureData] = useState('');
  const [signaturePadRef, setSignaturePadRef] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Generate unique contract ID
  useEffect(() => {
    const generateContractId = () => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      return `RENT-${timestamp}-${random}`;
    };
    
    if (!contractData.contractId) {
      setContractData(prev => ({
        ...prev,
        contractId: generateContractId()
      }));
    }
  }, [contractData.contractId]);

  // Handle user loading state
  useEffect(() => {
    if (user !== undefined) {
      setUserLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return; // Don't fetch if user is not available
      
      const propertyId = searchParams.get('propertyId');
      const participantId = searchParams.get('participantId');
      
      if (propertyId && participantId) {
        try {
          // Fetch property details
          const propertyRes = await axios.get(`${API_BASE}/api/property/${propertyId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setProperty(propertyRes.data);
          
          // Fetch participant details
          const participantRes = await axios.get(`${API_BASE}/api/user/${participantId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setParticipant(participantRes.data);
          
          // Auto-fill contract data
          setContractData(prev => ({
            ...prev,
            propertyAddress: propertyRes.data.address || propertyRes.data.location,
            tenantName: participantRes.data.name,
            tenantEmail: participantRes.data.email,
            tenantPhone: participantRes.data.phone || '',
            landlordName: user?.name || '',
            landlordEmail: user?.email || '',
            landlordPhone: user?.phone || '',
            placeOfExecution: 'Mumbai, Maharashtra'
          }));
        } catch (err) {
          console.error('Error fetching data:', err);
        }
      }
    };
    
    fetchData();
  }, [searchParams, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContractData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!contractData.propertyAddress) errors.propertyAddress = 'Property address is required.';
    if (!contractData.tenantName) errors.tenantName = 'Tenant name is required.';
    if (!contractData.tenantEmail) errors.tenantEmail = 'Tenant email is required.';
    if (!contractData.tenantPhone) errors.tenantPhone = 'Tenant phone is required.';
    if (!contractData.tenantAddress) errors.tenantAddress = 'Tenant address is required.';
    if (!contractData.landlordName) errors.landlordName = 'Landlord name is required.';
    if (!contractData.landlordEmail) errors.landlordEmail = 'Landlord email is required.';
    if (!contractData.landlordPhone) errors.landlordPhone = 'Landlord phone is required.';
    if (!contractData.landlordAddress) errors.landlordAddress = 'Landlord address is required.';
    if (!contractData.startDate) errors.startDate = 'Start date is required.';
    if (!contractData.endDate) errors.endDate = 'End date is required.';
    if (!contractData.monthlyRent) errors.monthlyRent = 'Monthly rent is required.';
    if (!contractData.securityDeposit) errors.securityDeposit = 'Security deposit is required.';
    if (!contractData.bedrooms) errors.bedrooms = 'Number of bedrooms is required.';
    if (!contractData.fans) errors.fans = 'Number of fans is required.';
    if (!contractData.lights) errors.lights = 'Number of lights is required.';
    if (!contractData.geysers) errors.geysers = 'Number of geysers is required.';
    if (!contractData.mirrors) errors.mirrors = 'Number of mirrors is required.';
    if (!contractData.taps) errors.taps = 'Number of taps is required.';
    if (!contractData.maintenanceCharges) errors.maintenanceCharges = 'Maintenance charges are required.';
    if (!contractData.landlordFatherName) errors.landlordFatherName = "Landlord's father name is required.";
    if (!contractData.tenantFatherName) errors.tenantFatherName = "Tenant's father name is required.";
    if (!contractData.tenantOccupation) errors.tenantOccupation = "Tenant's occupation (working at/studying at) is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!user) {
      alert('Please login to create a contract.');
      return;
    }
    setLoading(true);
    try {
      const contractPayload = {
        propertyId: searchParams.get('propertyId'),
        tenantId: searchParams.get('participantId'),
        landlordId: user?._id,
        contractId: contractData.contractId,
        startDate: contractData.startDate,
        endDate: contractData.endDate,
        monthlyRent: parseFloat(contractData.monthlyRent),
        securityDeposit: parseFloat(contractData.securityDeposit),
        terms: contractData.terms,
        conditions: contractData.conditions,
        propertyAddress: contractData.propertyAddress,
        tenantDetails: {
          name: contractData.tenantName,
          email: contractData.tenantEmail,
          phone: contractData.tenantPhone,
          address: contractData.tenantAddress
        },
        landlordDetails: {
          name: contractData.landlordName,
          email: contractData.landlordEmail,
          phone: contractData.landlordPhone,
          address: contractData.landlordAddress,
          profileImage: user?.profileImage || ''
        },
        placeOfExecution: contractData.placeOfExecution,
        witnessName: contractData.witnessName,
        witnessAddress: contractData.witnessAddress,
        bedrooms: Number(contractData.bedrooms),
        fans: Number(contractData.fans),
        lights: Number(contractData.lights),
        geysers: Number(contractData.geysers),
        mirrors: Number(contractData.mirrors),
        taps: Number(contractData.taps),
        maintenanceCharges: Number(contractData.maintenanceCharges),
        landlordFatherName: contractData.landlordFatherName,
        tenantFatherName: contractData.tenantFatherName,
        tenantOccupation: contractData.tenantOccupation,
        status: 'pending_approval',
        createdAt: new Date()
      };
      const response = await axios.post(`${API_BASE}/api/contract`, contractPayload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCreatedContract(response.data.contract);
      alert('Contract created! Check your chat for details.');
    } catch (err) {
      console.error('Error creating contract:', err);
      alert('Failed to create contract. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = () => {
    if (signaturePadRef && !signaturePadRef.isEmpty()) {
      setSignatureData(signaturePadRef.toDataURL());
      setFormErrors(errors => ({ ...errors, signature: undefined }));
    } else {
      setFormErrors(errors => ({ ...errors, signature: 'Signature is required.' }));
    }
  };

  const handleClear = () => {
    if (signaturePadRef) signaturePadRef.clear();
    setSignatureData('');
  };

  const generatePDF = async () => {
    try {
      const response = await axios.post(`${API_BASE}/api/contract/${contractData.contractId}/pdf`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rental_Contract_${contractData.contractId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 text-center border border-green-200">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="h-10 w-10 text-green-900" />
          </div>
          <h2 className="text-3xl font-bold text-green-900 mb-4">Please Login</h2>
          <p className="text-green-800 text-lg">You need to be logged in to create contracts.</p>
        </div>
      </div>
    );
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 text-center border border-green-200">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-900"></div>
          </div>
          <h2 className="text-3xl font-bold text-green-900 mb-4">Loading...</h2>
          <p className="text-green-800 text-lg">Please wait while we load your information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 p-8 pt-32">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-green-900 font-semibold hover:underline"
          >
            <ArrowLeft className="h-5 w-5" /> Back to Chat
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {previewMode ? 'Edit Mode' : 'Preview'}
            </button>
            {createdContract && (
              <button
                onClick={async () => {
                  try {
                    const res = await axios.post(`${API_BASE}/api/contract/${createdContract.contractId}/pdf`, {}, {
                      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                      responseType: 'blob'
                    });
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `Rental_Contract_${createdContract.contractId}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                  } catch (err) {
                    alert('Failed to download PDF.');
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            )}
          </div>
        </div>
        
        {previewMode ? (
          <ContractPreview contractData={contractData} property={property} participant={participant} user={user} />
        ) : (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-green-200">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-10 w-10 text-green-900" />
              </div>
              <h1 className="text-4xl font-bold text-green-900 mb-2">Create Legal Rental Contract</h1>
              <p className="text-green-700 text-lg">Fill in the details to create a legally binding rental agreement</p>
            </div>

            {/* Contract ID Display */}
            <div className="bg-green-50 rounded-2xl p-6 mb-8 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-green-900 text-lg">Contract ID</h3>
                  <p className="text-green-700 font-mono text-xl">{contractData.contractId}</p>
                </div>
                <div className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold">
                  DRAFT
                </div>
              </div>
            </div>

            {/* Property and Participant Info */}
            {(property || participant) && (
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {property && (
                  <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      <Home className="h-6 w-6 text-green-700" />
                      <h3 className="font-bold text-green-900">Property Details</h3>
                    </div>
                    <p className="text-green-800 font-semibold">{property.title}</p>
                    <p className="text-green-700">{property.location}</p>
                    <p className="text-green-700">₹{property.price?.toLocaleString()}/month</p>
                  </div>
                )}
                
                {participant && (
                  <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      <User className="h-6 w-6 text-green-700" />
                      <h3 className="font-bold text-green-900">Tenant Details</h3>
                    </div>
                    <p className="text-green-800 font-semibold">{participant.name}</p>
                    <p className="text-green-700">{participant.email}</p>
                    <p className="text-green-700">{participant.phone || 'Phone not provided'}</p>
                  </div>
                )}
              </div>
            )}

            {/* Contract Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Property Address */}
              <div>
                <label className="block text-green-900 font-semibold mb-2">
                  <Home className="h-4 w-4 inline mr-2" />
                  Property Address (Complete)
                </label>
                <textarea
                  name="propertyAddress"
                  value={contractData.propertyAddress}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200 resize-none"
                  placeholder="Enter complete property address..."
                />
              </div>

              {/* Tenant Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Tenant Full Name</label>
                  <input
                    type="text"
                    name="tenantName"
                    value={contractData.tenantName}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Tenant Email</label>
                  <input
                    type="email"
                    name="tenantEmail"
                    value={contractData.tenantEmail}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Tenant Phone</label>
                  <input
                    type="tel"
                    name="tenantPhone"
                    value={contractData.tenantPhone}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Tenant Address</label>
                  <input
                    type="text"
                    name="tenantAddress"
                    value={contractData.tenantAddress}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Landlord Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Landlord Full Name</label>
                  <input
                    type="text"
                    name="landlordName"
                    value={contractData.landlordName}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Landlord Email</label>
                  <input
                    type="email"
                    name="landlordEmail"
                    value={contractData.landlordEmail}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Landlord Phone</label>
                  <input
                    type="tel"
                    name="landlordPhone"
                    value={contractData.landlordPhone}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Landlord Address</label>
                  <input
                    type="text"
                    name="landlordAddress"
                    value={contractData.landlordAddress}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Rental Terms */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-green-900 font-semibold mb-2">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={contractData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-green-900 font-semibold mb-2">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={contractData.endDate}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
              </div>
              {/* Monthly Rent and Security Deposit */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    name="monthlyRent"
                    value={contractData.monthlyRent}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                    placeholder="Enter monthly rent"
                  />
                </div>
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Security Deposit (₹)</label>
                  <input
                    type="number"
                    name="securityDeposit"
                    value={contractData.securityDeposit}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                    placeholder="Enter security deposit"
                  />
                </div>
              </div>

              {/* Property Details - New Fields */}
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Bedrooms</label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={contractData.bedrooms}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Fans</label>
                  <input
                    type="number"
                    name="fans"
                    value={contractData.fans}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Lights</label>
                  <input
                    type="number"
                    name="lights"
                    value={contractData.lights}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Geysers</label>
                  <input
                    type="number"
                    name="geysers"
                    value={contractData.geysers}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Mirrors</label>
                  <input
                    type="number"
                    name="mirrors"
                    value={contractData.mirrors}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Taps</label>
                  <input
                    type="number"
                    name="taps"
                    value={contractData.taps}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Maintenance Charges (₹)</label>
                  <input
                    type="number"
                    name="maintenanceCharges"
                    value={contractData.maintenanceCharges}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Party Details - New Fields */}
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Landlord's Father Name</label>
                  <input
                    type="text"
                    name="landlordFatherName"
                    value={contractData.landlordFatherName}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Tenant's Father Name</label>
                  <input
                    type="text"
                    name="tenantFatherName"
                    value={contractData.tenantFatherName}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Tenant's Occupation (Working at / Studying at)</label>
                  <input
                    type="text"
                    name="tenantOccupation"
                    value={contractData.tenantOccupation}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Legal Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Place of Execution</label>
                  <input
                    type="text"
                    name="placeOfExecution"
                    value={contractData.placeOfExecution}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                    placeholder="e.g., Mumbai, Maharashtra"
                  />
                </div>
                <div>
                  <label className="block text-green-900 font-semibold mb-2">Witness Name (Optional)</label>
                  <input
                    type="text"
                    name="witnessName"
                    value={contractData.witnessName}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                    placeholder="Witness full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-green-900 font-semibold mb-2">Witness Address (Optional)</label>
                <input
                  type="text"
                  name="witnessAddress"
                  value={contractData.witnessAddress}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  placeholder="Witness address"
                />
              </div>

              <div>
                <label className="block text-green-900 font-semibold mb-2">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Terms & Conditions
                </label>
                <textarea
                  name="terms"
                  value={contractData.terms}
                  onChange={handleInputChange}
                  rows="6"
                  className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200 resize-none"
                  placeholder="Enter detailed rental terms and conditions..."
                />
              </div>

              <div>
                <label className="block text-green-900 font-semibold mb-2">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Additional Conditions
                </label>
                <textarea
                  name="conditions"
                  value={contractData.conditions}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full rounded-xl border-2 border-green-200 p-4 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200 resize-none"
                  placeholder="Enter any additional conditions..."
                />
              </div>

              <div>
                <label className="block text-green-900 font-semibold mb-2">E-Signature</label>
                <div className="border-2 border-green-200 rounded-xl bg-white p-4 flex flex-col items-center">
                  <SignaturePadWrapper
                    ref={setSignaturePadRef}
                    options={{
                      minWidth: 1,
                      maxWidth: 3,
                      penColor: 'rgb(16, 185, 129)',
                      backgroundColor: '#f9fafb',
                      width: 600,
                      height: 180
                    }}
                    style={{ borderRadius: '0.75rem', border: '1px solid #86efac', background: '#f9fafb' }}
                  />
                  <div className="flex gap-4 mt-2">
                    <button type="button" onClick={handleSign} className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Save Signature</button>
                    <button type="button" onClick={handleClear} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400">Clear</button>
                  </div>
                  {signatureData && <img src={signatureData} alt="Signature Preview" className="mt-2 h-12" />}
                  {formErrors.signature && <div className="text-red-600 mt-2">{formErrors.signature}</div>}
                </div>
              </div>

              {/* Show validation errors for other fields */}
              {Object.keys(formErrors).length > 0 && (
                <div className="text-red-600 mt-2">
                  {Object.entries(formErrors).map(([field, msg]) => (
                    <div key={field}>{msg}</div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 px-6 py-4 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5" />
                      Create Legal Contract
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

// Contract Preview Component
const ContractPreview = ({ contractData, property, participant, user }) => {
  const currentDate = new Date().toLocaleDateString('en-IN');
  
  return (
    <div className="bg-white rounded-3xl shadow-2xl border-2 border-green-200 overflow-hidden">
      {/* Government Header */}
      <div className="bg-white border-b-4 border-green-800 p-6 text-center flex flex-col items-center" style={{ position: 'relative' }}>
        <div className="flex items-center justify-center gap-4 mb-2">
          <img src="/ashoka-chakra.svg" alt="Ashoka Chakra" className="h-12 w-12" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Noto Sans Devanagari, serif' }}>भारत सरकार</h1>
            <h2 className="text-xl font-semibold text-gray-700 px-12">Government of India</h2>
          </div>
          <img src="/ashoka-chakra.svg" alt="Ashoka Chakra" className="h-12 w-12" />
        </div>
        <div className="bg-green-600 text-white px-6 py-2 rounded-full inline-block font-bold text-lg mt-2 pl-15">
          LEGAL RENTAL AGREEMENT
        </div>
        <div className="absolute top-2 right-4 bg-blue-700 text-white px-4 py-1 rounded-full font-bold text-xs shadow-lg" style={{ transform: 'rotate(-8deg)' }}>
          DIGITALLY VERIFIED
        </div>
      </div>

      {/* Authentication Badge */}
      <div className="bg-green-50 p-4 border-b-2 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span className="font-bold text-green-800">GOVERNMENT VERIFIED CONTRACT</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Contract ID</div>
            <div className="font-mono font-bold text-green-800">{contractData.contractId}</div>
          </div>
        </div>
      </div>

      {/* Contract Content */}
      <div className="p-8 space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">RENTAL AGREEMENT</h3>
          <p className="text-gray-600">This agreement is made on {currentDate}</p>
        </div>

        {/* Parties */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="border-2 border-green-200 rounded-xl p-6">
            <h4 className="font-bold text-lg text-green-800 mb-4 border-b-2 border-green-200 pb-2">LANDLORD</h4>
            <p className="font-semibold">{contractData.landlordName}</p>
            <p className="text-gray-700">{contractData.landlordEmail}</p>
            <p className="text-gray-700">{contractData.landlordPhone}</p>
            <p className="text-gray-700">{contractData.landlordAddress}</p>
          </div>
          
          <div className="border-2 border-green-200 rounded-xl p-6">
            <h4 className="font-bold text-lg text-green-800 mb-4 border-b-2 border-green-200 pb-2">TENANT</h4>
            <p className="font-semibold">{contractData.tenantName}</p>
            <p className="text-gray-700">{contractData.tenantEmail}</p>
            <p className="text-gray-700">{contractData.tenantPhone}</p>
            <p className="text-gray-700">{contractData.tenantAddress}</p>
          </div>
        </div>

        {/* Property Details */}
        <div className="border-2 border-green-200 rounded-xl p-6">
          <h4 className="font-bold text-lg text-green-800 mb-4 border-b-2 border-green-200 pb-2">PROPERTY DETAILS</h4>
          <p className="font-semibold text-lg">{property?.title}</p>
          <p className="text-gray-700 text-lg">{contractData.propertyAddress}</p>
        </div>

        {/* Terms */}
        <div className="border-2 border-green-200 rounded-xl p-6">
          <h4 className="font-bold text-lg text-green-800 mb-4 border-b-2 border-green-200 pb-2">RENTAL TERMS</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="font-semibold">Monthly Rent: ₹{parseInt(contractData.monthlyRent).toLocaleString()}</p>
              <p className="font-semibold">Security Deposit: ₹{parseInt(contractData.securityDeposit).toLocaleString()}</p>
            </div>
            <div>
              <p className="font-semibold">Start Date: {new Date(contractData.startDate).toLocaleDateString()}</p>
              <p className="font-semibold">End Date: {new Date(contractData.endDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        {contractData.terms && (
          <div className="border-2 border-green-200 rounded-xl p-6">
            <h4 className="font-bold text-lg text-green-800 mb-4 border-b-2 border-green-200 pb-2">TERMS & CONDITIONS</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{contractData.terms}</p>
          </div>
        )}

        {contractData.conditions && (
          <div className="border-2 border-green-200 rounded-xl p-6">
            <h4 className="font-bold text-lg text-green-800 mb-4 border-b-2 border-green-200 pb-2">ADDITIONAL CONDITIONS</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{contractData.conditions}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="border-2 border-green-200 rounded-xl p-6 text-center">
            <h4 className="font-bold text-lg text-green-800 mb-4">LANDLORD SIGNATURE</h4>
            {(contractData.landlordSignatureImage || contractData.signatures?.landlord?.signatureImage) && (
              <img
                src={contractData.landlordSignatureImage || contractData.signatures?.landlord?.signatureImage}
                alt="Landlord Signature"
                style={{ width: 200, height: 80, objectFit: 'contain', margin: '0 auto 8px' }}
              />
            )}
            <div className="border-b-2 border-gray-400 mb-4 pb-2">
              <p className="font-semibold">{contractData.landlordName}</p>
              <p className="text-sm text-gray-600">Signed electronically by {contractData.landlordName}</p>
              <p className="text-sm text-gray-600">on {currentDate}</p>
              <p className="text-sm text-gray-600">Place: {contractData.placeOfExecution}</p>
            </div>
            <div className="text-xs text-gray-500">
              <p>🔒 Digitally Signed</p>
              <p>✅ Legally Binding</p>
            </div>
          </div>
          
          <div className="border-2 border-green-200 rounded-xl p-6 text-center">
            <h4 className="font-bold text-lg text-green-800 mb-4">TENANT SIGNATURE</h4>
            {(contractData.tenantSignatureImage || contractData.signatures?.tenant?.signatureImage) && (
              <img
                src={contractData.tenantSignatureImage || contractData.signatures?.tenant?.signatureImage}
                alt="Tenant Signature"
                style={{ width: 200, height: 80, objectFit: 'contain', margin: '0 auto 8px' }}
              />
            )}
            <div className="border-b-2 border-gray-400 mb-4 pb-2">
              <p className="font-semibold">{contractData.tenantName}</p>
              <p className="text-sm text-gray-600">Signed electronically by {contractData.tenantName}</p>
              <p className="text-sm text-gray-600">on {currentDate}</p>
              <p className="text-sm text-gray-600">Place: {contractData.placeOfExecution}</p>
            </div>
            <div className="text-xs text-gray-500">
              <p>🔒 Digitally Signed</p>
              <p>✅ Legally Binding</p>
            </div>
          </div>
        </div>

        {/* Witness (if provided) */}
        {contractData.witnessName && (
          <div className="border-2 border-green-200 rounded-xl p-6 text-center">
            <h4 className="font-bold text-lg text-green-800 mb-4">WITNESS</h4>
            <div className="border-b-2 border-gray-400 mb-4 pb-2">
              <p className="font-semibold">{contractData.witnessName}</p>
              <p className="text-sm text-gray-600">{contractData.witnessAddress}</p>
              <p className="text-sm text-gray-600">Signed electronically on {currentDate}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 border-t-2 border-green-200 pt-6">
          <p>This document is digitally generated and legally binding under Indian law</p>
          <p>Generated via Real Estate Rental Platform • {currentDate}</p>
          <p>Document Hash: {contractData.contractId}</p>
        </div>
      </div>
    </div>
  );
};

// DocumentUploadSection component
const DocumentUploadSection = ({ userRole, contractId }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('aadhaar');
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleTypeChange = (e) => {
    setDocumentType(e.target.value);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('userRole', userRole);
    formData.append('documentType', documentType);
    try {
      await axios.post(`${API_BASE}/api/contract/${contractId}/upload-document`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUploadedFiles(prev => [...prev, { name: selectedFile.name, type: documentType }]);
      setSelectedFile(null);
      alert('Document uploaded successfully!');
    } catch (err) {
      alert('Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <label className="block mb-2 font-semibold">Document Type</label>
        <select value={documentType} onChange={handleTypeChange} className="w-full rounded-xl border-2 border-green-200 p-2">
          {userRole === 'landlord' ? (
            <>
              <option value="propertyOwnership">Property Ownership</option>
              <option value="propertyRegistration">Property Registration</option>
              <option value="photo">Photo</option>
            </>
          ) : (
            <>
              <option value="aadhaar">Aadhaar</option>
              <option value="pan">PAN</option>
              <option value="idProof">ID Proof</option>
              <option value="bankPassbook">Bank Passbook</option>
              <option value="photo">Photo</option>
            </>
          )}
        </select>
      </div>
      <input type="file" onChange={handleFileChange} className="mb-4" />
      <button onClick={handleUpload} disabled={uploading || !selectedFile} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 disabled:opacity-50">
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Uploaded Files:</h4>
        <ul>
          {uploadedFiles.map((file, idx) => (
            <li key={idx} className="text-green-800">{file.type}: {file.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CreateContract; 