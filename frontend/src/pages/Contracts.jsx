import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, XCircle, Clock, Download, Eye, User, Home, Calendar, DollarSign, Trash2, AlertCircle, Bell, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import SignaturePadWrapper from 'react-signature-pad-wrapper';

const API_BASE = 'http://localhost:5000';

const ContractStatusBadge = ({ status, isFullySigned }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'draft':
        return { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-4 w-4" /> };
      case 'pending_landlord_signature':
        return { color: 'bg-yellow-100 text-yellow-800', icon: <FileText className="h-4 w-4" /> };
      case 'pending_tenant_signature':
        return { color: 'bg-blue-100 text-blue-800', icon: <FileText className="h-4 w-4" /> };
      case 'pending_witness_signature':
        return { color: 'bg-purple-100 text-purple-800', icon: <FileText className="h-4 w-4" /> };
      case 'fully_signed':
        return { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> };
      case 'active':
        return { color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="h-4 w-4" /> };
      case 'completed':
        return { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-4 w-4" /> };
      case 'terminated':
        return { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> };
      case 'expired':
        return { color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="h-4 w-4" /> };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-4 w-4" /> };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${config.color}`}>
      {config.icon}
      {status.replace('_', ' ').toUpperCase()}
      {isFullySigned && status === 'fully_signed' && (
        <span className="ml-1 text-xs">✓</span>
      )}
    </span>
  );
};

const SignatureProgress = ({ contract, user }) => {
  const isLandlord = String(contract.landlordId._id) === String(user._id);
  const isTenant = String(contract.tenantId._id) === String(user._id);
  
  const signatures = [
    {
      role: 'landlord',
      name: contract.landlordDetails.name,
      signed: contract.signatures?.landlord?.signed || false,
      signedAt: contract.signatures?.landlord?.signedAt,
      isCurrentUser: isLandlord
    },
    {
      role: 'tenant',
      name: contract.tenantDetails.name,
      signed: contract.signatures?.tenant?.signed || false,
      signedAt: contract.signatures?.tenant?.signedAt,
      isCurrentUser: isTenant
    }
  ];

  if (contract.witnessName) {
    signatures.push({
      role: 'witness',
      name: contract.witnessName,
      signed: contract.signatures?.witness?.signed || false,
      signedAt: contract.signatures?.witness?.signedAt,
      isCurrentUser: false
    });
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Signature Progress</h4>
      <div className="space-y-2">
        {signatures.map((sig, index) => (
          <div key={sig.id || index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                sig.signed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {sig.signed ? <CheckCircle className="h-4 w-4" /> : index + 1}
              </div>
              <span className={`text-sm ${sig.isCurrentUser ? 'font-semibold text-blue-600' : 'text-gray-700'}`}>
                {sig.name} ({sig.role})
              </span>
              {sig.isCurrentUser && !sig.signed && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">You</span>
              )}
            </div>
            <div className="text-right">
              {sig.signed ? (
                <span className="text-xs text-green-600">
                  Signed {sig.signedAt ? new Date(sig.signedAt).toLocaleDateString() : ''}
                </span>
              ) : (
                <span className="text-xs text-gray-500">Pending</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ContractCard = ({ contract, user, onApprove, onReject, onDownloadPDF, onView, canApprove, canReject, canSign, onDelete, onSendReminder }) => {
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReminderConfirm, setShowReminderConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const isLandlord = String(contract.landlordId._id) === String(user._id);
  const isTenant = String(contract.tenantId._id) === String(user._id);
  const userRole = isLandlord ? 'landlord' : 'tenant';
  const otherPartyRole = isLandlord ? 'tenant' : 'landlord';
  const otherPartyName = isLandlord ? contract.tenantDetails.name : contract.landlordDetails.name;

  // Collapsible summary row
  return (
    <div key={contract.contractId} className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-green-200 p-0 relative mb-4">
      {/* Collapsible Header */}
      <button
        className="w-full flex items-center justify-between px-6 py-4 focus:outline-none hover:bg-green-50 rounded-t-2xl transition-all"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-green-900 text-lg">Contract</span>
          <span className="text-green-700 text-sm">{contract.propertyId?.title || contract.propertyAddress}</span>
          <ContractStatusBadge 
            status={contract.contractStatus?.current || contract.status} 
            isFullySigned={contract.isFullySigned}
          />
        </div>
        <span className="ml-2">
          {expanded ? (
            <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
          ) : (
            <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          )}
        </span>
      </button>
      {/* Expanded Content */}
      {expanded && (
        <div className="px-6 pb-6 pt-2">
          {/* Delete button in top right (inside expanded) */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="absolute top-4 right-4 p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-all duration-200"
            title="Delete Contract"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <div className="grid md:grid-cols-2 gap-4 mb-4 mt-2">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-green-600" />
              <span className="text-green-800">{contract.propertyId?.title || contract.propertyAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-green-800">
                {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-green-800">₹{contract.monthlyRent?.toLocaleString()}/month</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-green-600" />
              <span className="text-green-800">
                {isLandlord ? `Tenant: ${contract.tenantDetails.name}` : `Landlord: ${contract.landlordDetails.name}`}
              </span>
            </div>
          </div>
          {/* Signature Progress */}
          <SignatureProgress contract={contract} user={user} />
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-green-200 mt-4">
            <button
              onClick={() => onView(contract)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              View
            </button>
            {canApprove(contract) && (
              <button
                onClick={() => {
                  if (canSign(contract)) {
                    setShowReminderConfirm(true);
                  } else {
                    onApprove(contract.contractId);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-all duration-200 flex items-center gap-1"
              >
                <CheckCircle className="h-4 w-4" />
                Accept
              </button>
            )}
            {canReject(contract) && (
              <button
                onClick={() => setShowRejectConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all duration-200 flex items-center gap-1"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-bold hover:bg-red-800 transition-all duration-200 flex items-center gap-2"
            >
              <Trash2 className="h-5 w-5" />
              Delete
            </button>
          </div>
          {/* Signature Pad for Recipient (in FAQ/expanded section) */}
          {canSign(contract) && (
            <div className="mt-6 p-4 bg-gray-50 border border-green-200 rounded-xl">
              <h4 className="text-green-900 font-semibold mb-2">Sign Contract</h4>
              <SignaturePadWrapper
                ref={setSignaturePadRef}
                options={{ minWidth: 2, maxWidth: 4, penColor: '#14532d', backgroundColor: '#fff' }}
                className="border-2 border-green-300 rounded-xl w-full h-32 mb-2"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    if (signaturePadRef && !signaturePadRef.isEmpty()) {
                      onSign(contract.contractId, signaturePadRef.toDataURL());
                    } else {
                      alert('Please provide your signature.');
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                >
                  Sign & Submit
                </button>
                <button
                  onClick={() => signaturePadRef && signaturePadRef.clear()}
                  className="px-4 py-2 bg-gray-300 rounded-lg font-semibold hover:bg-gray-400"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Confirmation Modals (unchanged) */}
      {showRejectConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl text-center">
            <div className="text-lg font-semibold mb-4">Are you sure you want to reject this contract?</div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => { onReject(contract.contractId); setShowRejectConfirm(false); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
              >
                Yes, Reject
              </button>
              <button
                onClick={() => setShowRejectConfirm(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg font-semibold hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl text-center">
            <div className="text-lg font-semibold mb-4">Are you sure you want to delete this contract?</div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => { onDelete(contract._id); setShowDeleteConfirm(false); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg font-semibold hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showReminderConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl text-center">
            <div className="text-lg font-semibold mb-4">Send signature reminder to {otherPartyName}?</div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => { onSendReminder(contract.contractId, otherPartyRole); setShowReminderConfirm(false); }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700"
              >
                Send Reminder
              </button>
              <button
                onClick={() => setShowReminderConfirm(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg font-semibold hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Contracts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [signaturePadRef, setSignaturePadRef] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [modalLoading, setModalLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    fetchContracts();
    const interval = setInterval(fetchContracts, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Real-time contract updates
  useEffect(() => {
    const socket = window.socket;
    
    if (socket) {
      // Listen for contract signed events
      socket.on('contractSigned', (data) => {
        console.log('Contract signed event received:', data);
        fetchContracts(); // Refresh contracts list
      });

      // Listen for signature reminders
      socket.on('signatureReminder', (data) => {
        console.log('Signature reminder received:', data);
        alert(`📝 ${data.message}`);
      });

      // Listen for contract status updates
      socket.on('contractStatusUpdated', (data) => {
        console.log('Contract status updated:', data);
        fetchContracts(); // Refresh contracts list
      });

      return () => {
        socket.off('contractSigned');
        socket.off('signatureReminder');
        socket.off('contractStatusUpdated');
      };
    }
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/contract/my`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setContracts(response.data);
    } catch (err) {
      console.error('Error fetching contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (contractId) => {
    try {
      await axios.post(`${API_BASE}/api/contract/${contractId}/approve`, {
        feedback: feedback
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      alert('Contract approved successfully!');
      fetchContracts();
      setShowModal(false);
      setFeedback('');
    } catch (err) {
      console.error('Error approving contract:', err);
      alert('Failed to approve contract. Please try again.');
    }
  };

  const handleReject = async (contractId) => {
    try {
      await axios.post(`${API_BASE}/api/contract/${contractId}/reject`, {
        feedback: feedback
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      alert('Contract rejected successfully!');
      fetchContracts();
      setShowModal(false);
      setFeedback('');
    } catch (err) {
      console.error('Error rejecting contract:', err);
      alert('Failed to reject contract. Please try again.');
    }
  };

  const handleSign = async (contractId) => {
    if (!signatureData) {
      setFormErrors(errors => ({ ...errors, signature: 'Signature is required.' }));
      return;
    }
    try {
      await axios.post(`${API_BASE}/api/contract/${contractId}/sign`, {
        signatureText: `Signed electronically by ${user.name}`,
        signatureImage: signatureData
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Contract signed successfully!');
      setSignatureData('');
      if (signaturePadRef) signaturePadRef.clear();
      fetchContracts();
    } catch (err) {
      console.error('Error signing contract:', err);
      alert('Failed to sign contract. Please try again.');
    }
  };

  const handleSignSave = () => {
    if (signaturePadRef && !signaturePadRef.isEmpty()) {
      setSignatureData(signaturePadRef.toDataURL());
      setFormErrors(errors => ({ ...errors, signature: undefined }));
    } else {
      setFormErrors(errors => ({ ...errors, signature: 'Signature is required.' }));
    }
  };

  const handleSignClear = () => {
    if (signaturePadRef) signaturePadRef.clear();
    setSignatureData('');
  };

  const downloadPDF = async (contractId) => {
    try {
      const response = await axios.post(`${API_BASE}/api/contract/${contractId}/pdf`, {}, {
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
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'landlord_approved': return 'bg-blue-100 text-blue-800';
      case 'tenant_approved': return 'bg-purple-100 text-purple-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'pending_approval': return <Clock className="h-4 w-4" />;
      case 'landlord_approved': return <User className="h-4 w-4" />;
      case 'tenant_approved': return <User className="h-4 w-4" />;
      case 'expired': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const canApprove = (contract, user) => {
    const isLandlord = String(contract.landlordId._id) === String(user._id);
    const isTenant = String(contract.tenantId._id) === String(user._id);
    if (isLandlord) {
      return !contract.approvals.landlord.approved && contract.status === 'pending_approval';
    }
    if (isTenant) {
      return !contract.approvals.tenant.approved && contract.status === 'pending_approval';
    }
    return false;
  };

  const canReject = (contract, user) => {
    const isLandlord = String(contract.landlordId._id) === String(user._id);
    const isTenant = String(contract.tenantId._id) === String(user._id);
    if (isLandlord) {
      return !contract.approvals.landlord.approved && contract.status === 'pending_approval';
    }
    if (isTenant) {
      return !contract.approvals.tenant.approved && contract.status === 'pending_approval';
    }
    return false;
  };

  const canSign = (contract, user) => {
    const isLandlord = String(contract.landlordId._id) === String(user._id);
    const isTenant = String(contract.tenantId._id) === String(user._id);
    if (isLandlord) {
      return !contract.signatures?.landlord?.signed && 
             (contract.contractStatus?.current === 'pending_landlord_signature' || 
              contract.contractStatus?.current === 'draft');
    }
    if (isTenant) {
      return !contract.signatures?.tenant?.signed && 
             contract.contractStatus?.current === 'pending_tenant_signature';
    }
    return false;
  };

  const handleDelete = async (contractId) => {
    if (!window.confirm('Are you sure you want to delete this contract? This action cannot be undone.')) return;
    try {
      await axios.delete(`${API_BASE}/api/contract/remove/${contractId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setContracts(contracts => contracts.filter(c => c._id !== contractId));
      alert('Contract deleted successfully!');
    } catch (err) {
      console.error('Error deleting contract:', err);
      alert('Failed to delete contract. Please try again.');
    }
  };

  const handleSendReminder = async (contractId, recipientRole) => {
    try {
      await axios.post(`${API_BASE}/api/contract/${contractId}/send-reminder`, {
        recipientRole: recipientRole
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      alert('Signature reminder sent successfully!');
    } catch (err) {
      console.error('Error sending reminder:', err);
      alert('Failed to send reminder. Please try again.');
    }
  };

  // Fetch full contract details for modal
  const handleView = async (contract) => {
    setModalLoading(true);
    setShowModal(true);
    try {
      const response = await axios.get(`${API_BASE}/api/contract/${contract.contractId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSelectedContract(response.data);
    } catch (err) {
      alert('Failed to load contract details.');
      setShowModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  // Fetch and show PDF in modal
  const handlePreviewPDF = async (contractId) => {
    setPdfUrl(null);
    try {
      const response = await axios.post(`${API_BASE}/api/contract/${contractId}/pdf`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });
      setPdfUrl(URL.createObjectURL(new Blob([response.data])));
    } catch (err) {
      alert('Failed to load PDF preview.');
    }
  };

  // Only enable download if contract is fully signed
  const canDownloadPDF = (contract) => {
    return contract && contract.status === 'approved' && contract.signatures && contract.signatures.landlord && contract.signatures.tenant && contract.signatures.landlord.signed && contract.signatures.tenant.signed;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-900 mx-auto mb-4"></div>
          <div className="text-green-900 text-lg font-semibold">Loading contracts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 p-8 pt-32">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-green-900 font-semibold hover:underline"
          >
            <ArrowLeft className="h-5 w-5" /> Back
          </button>
          
          <h1 className="text-4xl font-bold text-green-900">My Contracts</h1>
          
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>

        {contracts.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center border border-green-200">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-12 w-12 text-green-700" />
            </div>
            <h2 className="text-2xl font-bold text-green-900 mb-4">No Contracts Yet</h2>
            <p className="text-green-700 text-lg mb-6">You haven't created or been involved in any rental contracts yet.</p>
            <button
              onClick={() => navigate('/messages')}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all duration-200"
            >
              Start a Conversation
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {contracts.filter(c => c.status !== 'rejected').map((contract) => (
              <ContractCard
                key={contract.contractId}
                contract={contract}
                user={user}
                onApprove={handleApprove}
                onReject={handleReject}
                onDownloadPDF={downloadPDF}
                onView={handleView}
                canApprove={canApprove}
                canReject={canReject}
                canSign={canSign}
                onDelete={handleDelete}
                onSendReminder={handleSendReminder}
              />
            ))}
          </div>
        )}
      </div>

      {/* Contract Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-green-900">Contract Preview</h2>
                <button
                  onClick={() => { setShowModal(false); setPdfUrl(null); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            {modalLoading || !selectedContract ? (
              <div className="p-6 text-center text-green-700">Loading contract details...</div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Contract ID</h3>
                  <p className="text-gray-700 font-mono">{selectedContract.contractId}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Property</h3>
                  <p className="text-gray-700">{selectedContract.propertyId?.title}</p>
                  <p className="text-gray-600">{selectedContract.propertyAddress}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2">Landlord</h3>
                    <p className="text-gray-700">{selectedContract.landlordDetails.name}</p>
                    <p className="text-gray-600">{selectedContract.landlordDetails.email}</p>
                    <p className="text-gray-600">{selectedContract.landlordDetails.phone}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2">Tenant</h3>
                    <p className="text-gray-700">{selectedContract.tenantDetails.name}</p>
                    <p className="text-gray-600">{selectedContract.tenantDetails.email}</p>
                    <p className="text-gray-600">{selectedContract.tenantDetails.phone}</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2">Rental Terms</h3>
                    <p className="text-gray-700">Monthly Rent: ₹{selectedContract.monthlyRent?.toLocaleString()}</p>
                    <p className="text-gray-700">Security Deposit: ₹{selectedContract.securityDeposit?.toLocaleString()}</p>
                    <p className="text-gray-700">Start Date: {new Date(selectedContract.startDate).toLocaleDateString()}</p>
                    <p className="text-gray-700">End Date: {new Date(selectedContract.endDate).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2">Status</h3>
                    <p className="text-gray-700">Status: {selectedContract.status.replace('_', ' ').toUpperCase()}</p>
                    <p className="text-gray-700">Created: {new Date(selectedContract.createdAt).toLocaleDateString()}</p>
                    {selectedContract.approvedAt && (
                      <p className="text-gray-700">Approved: {new Date(selectedContract.approvedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                
                {selectedContract.terms && (
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2">Terms & Conditions</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedContract.terms}</p>
                  </div>
                )}
                
                {selectedContract.conditions && (
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2">Additional Conditions</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedContract.conditions}</p>
                  </div>
                )}
                
                {/* Approval/Rejection Form */}
                {(canApprove(selectedContract, user) || canReject(selectedContract, user)) && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-semibold text-green-900 mb-2">Feedback (Optional)</h3>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-3 resize-none"
                      rows="3"
                      placeholder="Add any feedback or comments..."
                    />
                    
                    <div className="flex gap-3 mt-4">
                      {canApprove(selectedContract, user) && (
                        <button
                          onClick={() => handleApprove(selectedContract.contractId)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 flex items-center gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve Contract
                        </button>
                      )}
                      
                      {canReject(selectedContract, user) && (
                        <button
                          onClick={() => handleReject(selectedContract.contractId)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-200 flex items-center gap-1"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject Contract
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={() => handlePreviewPDF(selectedContract.contractId)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    Preview PDF
                  </button>
                  <button
                    onClick={() => downloadPDF(selectedContract.contractId)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${canDownloadPDF(selectedContract) ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    disabled={!canDownloadPDF(selectedContract)}
                  >
                    Download PDF
                  </button>
                </div>
                {pdfUrl && (
                  <div className="mt-4">
                    <iframe
                      src={pdfUrl}
                      title="Contract PDF Preview"
                      width="100%"
                      height="600px"
                      style={{ border: '1px solid #ccc', borderRadius: '8px' }}
                    />
                  </div>
                )}
                {!pdfUrl && (
                  <div className="mt-4 text-center text-green-700">Loading PDF...</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Signature Pad Modal */}
      {selectedContract && showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">&times;</button>
            <h2 className="text-2xl font-bold text-green-900 mb-4">Sign Contract</h2>
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
            </div>
            {signatureData && <img src={signatureData} alt="Signature Preview" className="mt-2 h-12" />}
            {formErrors.signature && <div className="text-red-600 mt-2">{formErrors.signature}</div>}
            <button
              className="mt-6 w-full px-4 py-2 bg-green-700 text-white rounded-lg font-bold hover:bg-green-800"
              onClick={() => handleSign(selectedContract.contractId)}
            >
              Submit Signature
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;
export { ContractCard };
export const canApprove = (contract, user) => {
  const isLandlord = String(contract.landlordId._id) === String(user._id);
  const isTenant = String(contract.tenantId._id) === String(user._id);
  if (isLandlord) {
    return !contract.approvals.landlord.approved && contract.status === 'pending_approval';
  }
  if (isTenant) {
    return !contract.approvals.tenant.approved && contract.status === 'pending_approval';
  }
  return false;
};

export const canReject = (contract, user) => {
  const isLandlord = String(contract.landlordId._id) === String(user._id);
  const isTenant = String(contract.tenantId._id) === String(user._id);
  if (isLandlord) {
    return !contract.approvals.landlord.approved && contract.status === 'pending_approval';
  }
  if (isTenant) {
    return !contract.approvals.tenant.approved && contract.status === 'pending_approval';
  }
  return false;
};

export const canSign = (contract, user) => {
  const isLandlord = String(contract.landlordId._id) === String(user._id);
  const isTenant = String(contract.tenantId._id) === String(user._id);
  if (isLandlord) {
    return !contract.signatures?.landlord?.signed && 
           (contract.contractStatus?.current === 'pending_landlord_signature' || 
            contract.contractStatus?.current === 'draft');
  }
  if (isTenant) {
    return !contract.signatures?.tenant?.signed && 
           contract.contractStatus?.current === 'pending_tenant_signature';
  }
  return false;
}; 