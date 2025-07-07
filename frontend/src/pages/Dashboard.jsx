import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Eye, CheckCircle, XCircle, Home, Users, FileText, TrendingUp, Calendar, DollarSign, MapPin, Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import propertiesData from '../data/properties.json';
import StarRating from '../components/StarRating';
import axios from 'axios';
import SignaturePadWrapper from 'react-signature-pad-wrapper';
import socket from '../socket';
import FAQCard from '../components/FAQCard';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A020F0', '#FF6384', '#36A2EB', '#FFCE56'];

function Dashboard() {
  const [properties, setProperties] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContract, setSelectedContract] = useState(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractActionLoading, setContractActionLoading] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [signaturePadRef, setSignaturePadRef] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [hasStoredSignature, setHasStoredSignature] = useState(false);
  const [storedSignature, setStoredSignature] = useState(null);
  const [signatureStatusLoading, setSignatureStatusLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    try {
      if (user) {
        setProperties(propertiesData.filter(p => p.owner && p.owner.id === user._id));
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load dashboard data.');
      setLoading(false);
    }
  }, [user]);

  // Fetch contracts for the user
  const fetchContracts = async () => {
    if (!user) return;
    try {
      console.log('Fetching contracts for user:', user._id);
      const res = await axios.get('http://localhost:5000/api/contract/my', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('Contracts fetched:', res.data);
      setContracts(res.data);
    } catch (err) {
      console.error('Error fetching contracts:', err);
      console.error('Error response:', err.response?.data);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [user]);

  // Listen for contract updates from FAQ card
  useEffect(() => {
    if (!user) return;
    
    const handleContractUpdated = async (data) => {
      console.log('Contract updated event received:', data);
      // Refresh contracts list when contract is updated
      await fetchContracts();
    };

    const handleContractSigned = async (data) => {
      console.log('Contract signed event received:', data);
      // Refresh contracts list when contract is signed
      await fetchContracts();
    };

    const handleContractApproved = async (data) => {
      console.log('Contract approved event received:', data);
      // Refresh contracts list when contract is approved
      await fetchContracts();
    };

    const handleContractRejected = async (data) => {
      console.log('Contract rejected event received:', data);
      // Refresh contracts list when contract is rejected
      await fetchContracts();
    };

    const handleContractUpdate = async (data) => {
      console.log('contractUpdate event received:', data);
      await fetchContracts();
    };

    socket.on('contractUpdate', handleContractUpdate);
    socket.on('contractUpdated', handleContractUpdated);
    socket.on('contractSigned', handleContractSigned);
    socket.on('contractApproved', handleContractApproved);
    socket.on('contractRejected', handleContractRejected);

    return () => {
      socket.off('contractUpdated', handleContractUpdated);
      socket.off('contractSigned', handleContractSigned);
      socket.off('contractApproved', handleContractApproved);
      socket.off('contractRejected', handleContractRejected);
      socket.off('contractUpdate', handleContractUpdate);
    };
  }, [user]);

  // Check signature status on component mount
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

  // Delete contract function
  const handleDeleteContract = async (contractId) => {
    console.log('Attempting to delete contract with ID:', contractId);
    const contract = contracts.find(c => c.contractId === contractId);
    console.log('Contract object:', contract);
    
    if (!contract) {
      console.error('Contract not found in local state');
      alert('Contract not found. Please refresh the page and try again.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this contract? This action cannot be undone.')) return;
    
    try {
      console.log('Making DELETE request to:', `http://localhost:5000/api/contract/remove/${contractId}`);
      const response = await axios.delete(`http://localhost:5000/api/contract/remove/${contractId}`, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Delete response:', response.data);
      setContracts(contracts => contracts.filter(c => c.contractId !== contractId));
      alert('Contract deleted successfully!');
    } catch (err) {
      console.error('Error deleting contract:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error message:', err.message);
      
      if (err.response?.status === 404) {
        alert('Contract not found on server. It may have been already deleted.');
      } else if (err.response?.status === 403) {
        alert('You are not authorized to delete this contract.');
      } else if (err.response?.status === 401) {
        alert('Authentication failed. Please log in again.');
      } else {
        alert(`Failed to delete contract: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  // Approve contract function
  const handleApproveContract = async (contractId) => {
    setContractActionLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/contract/${contractId}/approve`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Refresh contracts list to get updated status
      const res = await axios.get('http://localhost:5000/api/contract/my', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setContracts(res.data);
      
      alert('Contract approved successfully!');
      setShowContractModal(false);
    } catch (err) {
      console.error('Error approving contract:', err);
      alert('Failed to approve contract. Please try again.');
    } finally {
      setContractActionLoading(false);
    }
  };

  // Reject contract function
  const handleRejectContract = async (contractId) => {
    setContractActionLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/contract/${contractId}/reject`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Refresh contracts list to get updated status
      const res = await axios.get('http://localhost:5000/api/contract/my', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setContracts(res.data);
      
      alert('Contract rejected successfully!');
      setShowContractModal(false);
    } catch (err) {
      console.error('Error rejecting contract:', err);
      alert('Failed to reject contract. Please try again.');
    } finally {
      setContractActionLoading(false);
    }
  };

  // Download PDF function
  const handleDownloadPDF = async (contractId) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/contract/${contractId}/pdf`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rental_Contract_${contractId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF. Please try again.');
    }
  };

  // View contract details
  const handleViewContract = (contract) => {
    setSelectedContract(contract);
    setShowContractModal(true);
  };

  // Handle opening signature modal
  const handleOpenSignatureModal = (contract) => {
    setSelectedContract(contract);
    setShowSignatureModal(true);
  };

  // Handle signature submission
  const handleSign = async (contractId) => {
    if (!signatureData) {
      setFormErrors(errors => ({ ...errors, signature: 'Signature is required.' }));
      return;
    }

    try {
      setContractActionLoading(true);
      // Get token from localStorage or context if needed
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/contract/${contractId}/sign`,
        {
          signatureText: `Signed electronically by ${user.name}`,
          signatureImage: signatureData
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true
        }
      );

      if (response.status === 200) {
        // Clear signature data
        setSignatureData('');
        if (signaturePadRef) signaturePadRef.clear();
        
        // Close modal and refresh contracts
        setShowSignatureModal(false);
        setSelectedContract(null);
        fetchContracts();
        
        alert('Contract signed successfully!');
      }
    } catch (error) {
      console.error('Error signing contract:', error);
      alert('Failed to sign contract. Please try again.');
    } finally {
      setContractActionLoading(false);
    }
  };

  // Handle signature save
  const handleSignSave = () => {
    if (signaturePadRef && !signaturePadRef.isEmpty()) {
      setSignatureData(signaturePadRef.toDataURL());
      setFormErrors(errors => ({ ...errors, signature: undefined }));
    } else {
      setFormErrors(errors => ({ ...errors, signature: 'Signature is required.' }));
    }
  };

  // Handle signature clear
  const handleSignClear = () => {
    if (signaturePadRef) signaturePadRef.clear();
    setSignatureData('');
  };

  // Handle signature save to user profile
  const handleSaveSignatureToProfile = async () => {
    if (!signaturePadRef || signaturePadRef.isEmpty()) {
      alert('Please provide your signature first.');
      return;
    }

    try {
      setContractActionLoading(true);
      const signatureImage = signaturePadRef.toDataURL();
      const token = localStorage.getItem('token');
      
      await axios.post('http://localhost:5000/api/user/signature', {
        signatureImage: signatureImage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setHasStoredSignature(true);
      setStoredSignature(signatureImage);
      alert('Signature saved to your profile! You can now use it for future contracts.');
    } catch (error) {
      console.error('Error saving signature:', error);
      alert('Failed to save signature. Please try again.');
    } finally {
      setContractActionLoading(false);
    }
  };

  // Handle contract signing with stored signature
  const handleSignWithStoredSignature = async (contractId) => {
    if (!hasStoredSignature) {
      alert('No stored signature found. Please create a signature first.');
      return;
    }

    try {
      setContractActionLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `http://localhost:5000/api/contract/${contractId}/sign`,
        {
          signatureText: `Signed electronically by ${user.name}`,
          useStoredSignature: true
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true
        }
      );

      if (response.status === 200) {
        // Close modal and refresh contracts
        setShowSignatureModal(false);
        setSelectedContract(null);
        fetchContracts();
        
        alert('Contract signed successfully using your stored signature!');
      }
    } catch (error) {
      console.error('Error signing contract:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to sign contract. Please try again.');
      }
    } finally {
      setContractActionLoading(false);
    }
  };

  // Check if user can approve contract
  const canApproveContract = (contract) => {
    if (contract.status === 'rejected' || contract.status === 'approved') return false;
    const isLandlord = String(contract.landlordId._id) === String(user._id);
    const isTenant = String(contract.tenantId._id) === String(user._id);
    if (isLandlord) {
      return !contract.approvals?.landlord?.approved;
    }
    if (isTenant) {
      return !contract.approvals?.tenant?.approved;
    }
    return false;
  };

  // Check if user can sign contract
  const canSignContract = (contract) => {
    const currentStatus = contract.contractStatus?.current || contract.status;
    if (currentStatus === 'rejected' || currentStatus === 'approved') return false;
    
    const isLandlord = String(contract.landlordId._id) === String(user._id);
    const isTenant = String(contract.tenantId._id) === String(user._id);
    
    if (isLandlord) {
      return !contract.signatures?.landlord?.signed && 
             (currentStatus === 'pending_landlord_signature' || currentStatus === 'draft');
    }
    if (isTenant) {
      return !contract.signatures?.tenant?.signed && 
             (currentStatus === 'pending_tenant_signature' || currentStatus === 'pending_approval');
    }
    return false;
  };

  // Check if user can reject contract
  const canRejectContract = (contract) => {
    if (contract.status === 'rejected' || contract.status === 'approved') return false;
    const isLandlord = String(contract.landlordId._id) === String(user._id);
    const isTenant = String(contract.tenantId._id) === String(user._id);
    if (isLandlord) {
      return !contract.approvals?.landlord?.rejected;
    }
    if (isTenant) {
      return !contract.approvals?.tenant?.rejected;
    }
    return false;
  };

  // Get status color and icon
  const getStatusInfo = (status) => {
    // Handle both old status field and new contractStatus.current
    const actualStatus = status?.current || status;
    
    switch (actualStatus) {
      case 'approved':
        return { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> };
      case 'pending_approval':
      case 'draft':
        return { color: 'bg-yellow-100 text-yellow-800', icon: <Calendar className="h-4 w-4" /> };
      case 'landlord_approved':
        return { color: 'bg-blue-100 text-blue-800', icon: <Users className="h-4 w-4" /> };
      case 'tenant_approved':
        return { color: 'bg-purple-100 text-purple-800', icon: <Users className="h-4 w-4" /> };
      case 'fully_signed':
        return { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: <FileText className="h-4 w-4" /> };
    }
  };

  // Stats
  const totalProperties = properties.length;
  const activeContracts = contracts.filter(c => {
    const status = c.contractStatus?.current || c.status;
    return status === 'approved' || status === 'fully_signed';
  }).length;
  const pendingContracts = contracts.filter(c => {
    const status = c.contractStatus?.current || c.status;
    return status === 'pending_approval' || status === 'draft' || status === 'landlord_approved' || status === 'tenant_approved';
  }).length;
  const rejectedContracts = contracts.filter(c => {
    const status = c.contractStatus?.current || c.status;
    return status === 'rejected';
  }).length;
  const totalContracts = contracts.length;

  // Properties listed over time (by createdAt)
  const propertiesByDate = {};
  properties.forEach(p => {
    const date = (p.createdAt || '').slice(0, 10);
    if (!date) return;
    propertiesByDate[date] = (propertiesByDate[date] || 0) + 1;
  });
  const propertiesOverTime = Object.entries(propertiesByDate).map(([date, count]) => ({ date, count }));

  // Property type distribution
  const typeCounts = {};
  properties.forEach(p => {
    const type = p.propertyType || p.type || 'Other';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  const typeData = Object.entries(typeCounts).map(([type, value]) => ({ name: type, value }));

  // Recent activity
  const recentProperties = [...properties].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-900 mx-auto mb-4"></div>
        <div className="text-green-900 text-lg font-semibold">Loading dashboard...</div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-700 text-lg font-semibold">{error}</div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 text-center border border-green-200">
          <h2 className="text-2xl font-bold text-green-900 mb-2">Please Login</h2>
          <p className="text-green-800">You need to be logged in to view the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 p-8 pt-32">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-green-900 font-semibold hover:underline transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" /> Back
          </button>
          
          <h1 className="text-4xl font-bold text-green-900">Dashboard</h1>
          
          <div className="w-20"></div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-800">{totalProperties}</div>
                <div className="text-green-700 font-medium">Properties Listed</div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Home className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-800">{totalContracts}</div>
                <div className="text-blue-700 font-medium">Total Contracts</div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-800">{activeContracts}</div>
                <div className="text-green-700 font-medium">Active Contracts</div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-yellow-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-yellow-800">{pendingContracts}</div>
                <div className="text-yellow-700 font-medium">Pending Approval</div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-red-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-red-800">{rejectedContracts}</div>
                <div className="text-red-700 font-medium">Rejected Contracts</div>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Properties Chart */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-green-200 p-6">
              <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Properties Listed Over Time
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={propertiesOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Property Type Distribution */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-green-200 p-6">
              <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Type Distribution
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={typeData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={100} 
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {typeData.map((entry, idx) => (
                      <Cell key={entry.name || idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Contracts Section */}
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-green-200 p-6">
              <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your Contracts
              </h2>
              
              {contracts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-green-700 font-medium">No contracts yet</p>
                  <p className="text-green-600 text-sm">Start by messaging property owners</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {contracts.map(contract => {
                    const statusInfo = getStatusInfo(contract.contractStatus || contract.status);
                    const actualStatus = contract.contractStatus?.current || contract.status;
                    return (
                      <div key={contract.contractId} className="bg-gradient-to-r from-green-50 to-white rounded-xl p-4 border border-green-200 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-green-900 mb-1">
                              {contract.propertyAddress || contract.propertyId?.title || 'Property'}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusInfo.color}`}>
                                {statusInfo.icon}
                                {actualStatus.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-green-700 space-y-1">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ₹{contract.monthlyRent?.toLocaleString()}/month
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {contract.contractId}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {canSignContract(contract) && (
                            <button
                              onClick={() => handleOpenSignatureModal(contract)}
                              className="px-3 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition-all duration-200 flex items-center gap-1"
                            >
                              <FileText className="h-4 w-4" />
                              Sign
                            </button>
                          )}
                          
                          {/* Show signature status */}
                          {contract.signatures?.landlord?.signed && (
                            <div className="flex items-center gap-1 text-green-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs">Landlord Signed</span>
                            </div>
                          )}
                          {contract.signatures?.tenant?.signed && (
                            <div className="flex items-center gap-1 text-green-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs">Tenant Signed</span>
                            </div>
                          )}
                          
                          <button
                            onClick={() => handleDownloadPDF(contract.contractId)}
                            className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-all duration-200 flex items-center gap-1"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                            PDF
                          </button>
                          
                          {canApproveContract(contract) && (
                            <button
                              onClick={() => handleApproveContract(contract.contractId)}
                              disabled={contractActionLoading}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-all duration-200 flex items-center gap-1 disabled:opacity-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Accept
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteContract(contract.contractId)}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200"
                            title="Delete Contract"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Properties */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-green-200 p-6">
              <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
                <Home className="h-5 w-5" />
                Recent Properties
              </h2>
              <div className="space-y-4">
                {recentProperties.length === 0 ? (
                  <p className="text-green-700 text-center py-4">No properties listed yet</p>
                ) : (
                  recentProperties.map(property => (
                    <div key={property._id || property.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-semibold text-green-900">{property.title}</div>
                        <div className="text-sm text-green-700">{(property.createdAt || '').slice(0, 10)}</div>
                        {property.rating && (
                          <StarRating rating={property.rating} reviews={property.reviews} size="sm" showReviews={false} />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* FAQ Cards for Contracts */}
            <div className="my-8">
              {contracts.length === 0 ? (
                <div className="text-gray-500 text-center">No contracts found.</div>
              ) : (
                contracts.map((contract, idx) => (
                  <FAQCard
                    key={contract.contractId || idx}
                    contract={contract}
                    currentUser={user}
                    onContractAction={async (action) => {
                      if (action === 'approve') return handleApproveContract(contract.contractId);
                      if (action === 'reject') return handleRejectContract(contract.contractId);
                      if (action === 'download') return handleDownloadPDF(contract.contractId);
                      if (action === 'create') return null; // Not supported here
                    }}
                    onDelete={handleDeleteContract}
                    showSignaturePad={showSignatureModal && selectedContract?.contractId === contract.contractId}
                    setShowSignaturePad={(show) => {
                      setShowSignatureModal(show);
                      setSelectedContract(show ? contract : null);
                    }}
                    signaturePadRef={signaturePadRef}
                    onClearSignature={handleSignClear}
                    onSaveSignature={handleSignSave}
                    isLatest={idx === 0}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contract Details Modal */}
      {showContractModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-green-900">Contract Details</h2>
                <button
                  onClick={() => { setShowContractModal(false); setSelectedContract(null); }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Contract Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Contract ID:</span> {selectedContract.contractId}</div>
                    <div><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusInfo(selectedContract.contractStatus || selectedContract.status).color}`}>
                        {(selectedContract.contractStatus?.current || selectedContract.status).replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div><span className="font-medium">Property:</span> {selectedContract.propertyAddress}</div>
                    <div><span className="font-medium">Monthly Rent:</span> ₹{selectedContract.monthlyRent?.toLocaleString()}</div>
                    <div><span className="font-medium">Security Deposit:</span> ₹{selectedContract.securityDeposit?.toLocaleString()}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Rental Period</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Start Date:</span> {new Date(selectedContract.startDate).toLocaleDateString()}</div>
                    <div><span className="font-medium">End Date:</span> {new Date(selectedContract.endDate).toLocaleDateString()}</div>
                    <div><span className="font-medium">Created:</span> {new Date(selectedContract.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
              
              {selectedContract.terms && (
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Terms & Conditions</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedContract.terms}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {canApproveContract(selectedContract) && (
                  <button
                    onClick={() => handleApproveContract(selectedContract.contractId)}
                    disabled={contractActionLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Accept Contract
                  </button>
                )}
                
                {canRejectContract(selectedContract) && (
                  <button
                    onClick={() => handleRejectContract(selectedContract.contractId)}
                    disabled={contractActionLoading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Contract
                  </button>
                )}
                
                <button
                  onClick={() => handleDeleteContract(selectedContract.contractId)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-all duration-200 flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad Modal */}
      {selectedContract && showSignatureModal && canSignContract(selectedContract) && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative">
            <button onClick={() => setShowSignatureModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">&times;</button>
            <h2 className="text-2xl font-bold text-green-900 mb-4">Sign Contract</h2>
            
            {/* Signature Status */}
            {signatureStatusLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-900 mx-auto mb-2"></div>
                <div className="text-gray-600">Checking signature status...</div>
              </div>
            ) : hasStoredSignature ? (
              <div className="mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-green-600">✓</span>
                    <span className="font-semibold text-green-800">Stored Signature Available</span>
                  </div>
                  <p className="text-sm text-green-700 mb-3">You can use your stored signature to sign this contract quickly.</p>
                  {storedSignature && (
                    <img src={storedSignature} alt="Stored Signature" className="h-12 border border-gray-300 rounded" />
                  )}
                  <button
                    onClick={() => handleSignWithStoredSignature(selectedContract.contractId)}
                    disabled={contractActionLoading}
                    className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    {contractActionLoading ? 'Signing...' : 'Sign with Stored Signature'}
                  </button>
                </div>
                <div className="text-center text-gray-500 text-sm">- OR -</div>
              </div>
            ) : (
              <div className="mb-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-orange-600">⚠</span>
                    <span className="font-semibold text-orange-800">No Stored Signature</span>
                  </div>
                  <p className="text-sm text-orange-700">Create a signature below and save it to your profile for future use.</p>
                </div>
              </div>
            )}

            {/* Signature Pad */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Create New Signature</h3>
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
                <button type="button" onClick={handleSignSave} className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Save Signature</button>
                <button type="button" onClick={handleSignClear} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400">Clear</button>
                <button type="button" onClick={handleSaveSignatureToProfile} disabled={contractActionLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {contractActionLoading ? 'Saving...' : 'Save to Profile'}
                </button>
              </div>
              {signatureData && <img src={signatureData} alt="Signature Preview" className="mt-2 h-12" />}
              {formErrors.signature && <div className="text-red-600 mt-2">{formErrors.signature}</div>}
            </div>

            {/* Submit Button */}
            <button
              className="mt-6 w-full px-4 py-2 bg-green-700 text-white rounded-lg font-bold hover:bg-green-800"
              onClick={() => {
                if (!signatureData) {
                  handleSignSave();
                  setFormErrors(errors => ({ ...errors, signature: 'Signature is required.' }));
                  return;
                }
                handleSign(selectedContract.contractId);
              }}
              disabled={contractActionLoading || !signatureData}
            >
              {contractActionLoading ? 'Signing...' : 'Submit Signature'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard; 