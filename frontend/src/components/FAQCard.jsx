import React, { useState, useEffect, useRef } from 'react';
import SignaturePadWrapper from 'react-signature-pad-wrapper';
import axios from 'axios';
import socket from '../socket';

const FAQCard = ({ contract: initialContract, currentUser, onDelete }) => {
  const [contract, setContract] = useState(initialContract);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const signaturePadRef = useRef();
  const [notification, setNotification] = useState(null);

  
  useEffect(() => {
    setContract(initialContract);
  }, [initialContract]);

  useEffect(() => {
    if (!contract?.contractId) return;
    const updateHandler = (data) => {
      if (data.contractId === contract.contractId && data.contract) {
        setContract(data.contract);
      }
    };
    socket.on('contractUpdate', updateHandler);
    return () => {
      socket.off('contractUpdate', updateHandler);
    };
  }, [contract?.contractId]);

  useEffect(() => {
    if (currentUser?._id) {
      socket.emit('register', currentUser._id);
    }
  }, [currentUser?._id]);

  //status logics
  const landlordName = contract?.landlordDetails?.name || 'Landlord';
  const tenantName = contract?.tenantDetails?.name || 'Tenant';
  const landlordApproved = contract?.approvals?.landlord?.approved === true;
  const tenantApproved = contract?.approvals?.tenant?.approved === true;
  const landlordSigned = contract?.signatures?.landlord?.signed === true;
  const tenantSigned = contract?.signatures?.tenant?.signed === true;
  if (contract?.signatures?.landlord?.signatureImage) {
    console.log('Landlord signature image present in contract prop');
  }
  if (contract?.signatures?.tenant?.signatureImage) {
    console.log('Tenant signature image present in contract prop');
  }
  console.log('landlordApproved:', landlordApproved, 'tenantApproved:', tenantApproved, 'landlordSigned:', landlordSigned, 'tenantSigned:', tenantSigned);
  const isRejected = contract?.contractStatus?.current === 'rejected' || contract?.status === 'rejected';
  const isApproved = contract?.contractStatus?.current === 'approved' || contract?.status === 'approved' || contract?.contractStatus?.current === 'fully_signed';
  const bothApproved = landlordApproved && tenantApproved;
  const bothSigned = landlordSigned && tenantSigned;

//role
  const landlordIdVal = contract.landlordId?._id || contract.landlordId;
  const tenantIdVal = contract.tenantId?._id || contract.tenantId;
  const isCurrentLandlord = currentUser && (String(landlordIdVal) === String(currentUser._id));
  const isCurrentTenant = currentUser && (String(tenantIdVal) === String(currentUser._id));
  const isSenderOrAdmin = isCurrentLandlord || currentUser?.role === 'admin';

//badge
  const getStatusInfo = () => {
    if (isRejected) return { color: 'bg-red-100 text-red-800', text: 'REJECTED' };
    if (bothSigned) return { color: 'bg-green-100 text-green-800', text: 'FULLY SIGNED' };
    if (bothApproved) return { color: 'bg-blue-100 text-blue-800', text: 'APPROVED - PENDING SIGNATURES' };
    if (landlordApproved || tenantApproved) return { color: 'bg-yellow-100 text-yellow-800', text: 'PARTIALLY APPROVED' };
    return { color: 'bg-gray-100 text-gray-700', text: 'PENDING APPROVAL' };
  };
  const statusInfo = getStatusInfo();

  const handleAction = async (action) => {
    setIsLoading(true);
    setNotification(null);
    try {
      const token = localStorage.getItem('token');
      if (action === 'approve') {
        socket.emit('contractAction', { action: 'approve', contractId: contract.contractId, userId: currentUser._id });
        setNotification({ type: 'success', message: 'Approval sent!' });
      } else if (action === 'reject') {
        socket.emit('contractAction', { action: 'reject', contractId: contract.contractId, userId: currentUser._id });
        setNotification({ type: 'success', message: 'Rejection sent.' });
      } else if (action === 'download') {
        try {
          const res = await fetch(`http://localhost:5000/api/contract/${contract.contractId}/pdf`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Failed to download PDF');
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Rental_Contract_${contract.contractId}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        } catch (err) {
          setNotification({ type: 'error', message: 'Failed to download PDF.' });
        }
        setIsLoading(false);
        return;
      } else if (action === 'delete') {
        if (window.confirm('Are you sure you want to delete this contract?')) {
          await onDelete(contract.contractId);
        }
      }
    } catch (error) {
      setNotification({ type: 'error', message: `Failed to ${action} contract.` });
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleSignSave = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      setSignatureData(signaturePadRef.current.toDataURL());
    } else {
      alert('Signature is required.');
    }
  };
  const handleSignClear = () => {
    if (signaturePadRef.current) signaturePadRef.current.clear();
    setSignatureData('');
  };
  const handleSignContract = async () => {
    if (!signatureData) {
      alert('Signature is required.');
      return;
    }
    setIsLoading(true);
    try {
      socket.emit('contractAction', {
        action: 'sign',
        contractId: contract.contractId,
        userId: currentUser._id,
        signatureText: `Signed electronically by ${currentUser.name} at ${new Date().toLocaleString()}`,
        signatureImage: signatureData
      });
      setShowSignaturePad(false);
      setSignatureData('');
      if (signaturePadRef.current) signaturePadRef.current.clear();
      setNotification({ type: 'success', message: 'Signature sent!' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to sign contract.' });
    } finally {
      setIsLoading(false);
    }
  };

  // UI
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 mb-4 transition-all duration-300 ${isCollapsed ? '' : 'ring-2 ring-blue-300'} overflow-hidden`}> 
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 cursor-pointer group hover:bg-gray-50 transition" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 flex-1">
          <div className="text-lg font-bold text-gray-800">Contract #{contract.contractId}</div>
          <div className={`ml-0 md:ml-2 mt-1 md:mt-0 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>{statusInfo.text}</div>
          <div className="ml-0 md:ml-4 text-xs text-gray-500">Created: {new Date(contract.createdAt).toLocaleDateString()}</div>
        </div>
        <div className="flex items-center space-x-2">
          {isSenderOrAdmin && (
            <button onClick={e => { e.stopPropagation(); handleAction('delete'); }} disabled={isLoading} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Delete contract">🗑️</button>
          )}
          <button onClick={e => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all duration-200" title={isCollapsed ? "Expand" : "Collapse"}>
            <svg className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      <div className={`transition-all duration-300 bg-gray-50 ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-screen opacity-100'} overflow-hidden px-6`} style={{ borderTop: '1px solid #e5e7eb' }}>
        <div className="py-6 space-y-6">
        
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-gray-700"><strong>Lessor (Landlord):</strong> {landlordName}</p>
              <p className="text-gray-700"><strong>Lessee (Tenant):</strong> {tenantName}</p>
              <p className="text-gray-700"><strong>Property Address:</strong> {contract.propertyAddress}</p>
              <p className="text-gray-700"><strong>Monthly Rent:</strong> ₹{contract.monthlyRent?.toLocaleString()}</p>
              <p className="text-gray-700"><strong>Security Deposit:</strong> ₹{contract.securityDeposit?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-700"><strong>Duration:</strong> {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}</p>
              <p className="text-gray-700"><strong>Created:</strong> {new Date(contract.createdAt).toLocaleDateString()}</p>
              <p className="text-gray-700"><strong>Status:</strong> {statusInfo.text}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">Approval Status</h4>
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full ${landlordApproved ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-600">{landlordName}</span>
                {landlordApproved && (
                  <span className="text-xs text-green-700 font-medium">✓ Approved {contract.approvals?.landlord?.approvedAt && `(${new Date(contract.approvals.landlord.approvedAt).toLocaleDateString()})`}</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full ${tenantApproved ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-600">{tenantName}</span>
                {tenantApproved && (
                  <span className="text-xs text-green-700 font-medium">✓ Approved {contract.approvals?.tenant?.approvedAt && `(${new Date(contract.approvals.tenant.approvedAt).toLocaleDateString()})`}</span>
                )}
              </div>
            </div>
          </div>
          {/* Signature Status */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">Signature Status</h4>
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full ${landlordSigned ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-600">{landlordName}</span>
                {landlordSigned && (
                  <span className="text-xs text-green-700 font-medium">✓ Signed {contract.signatures?.landlord?.signedAt && `(${new Date(contract.signatures.landlord.signedAt).toLocaleDateString()})`}<br/>Signed by: {contract.signatures?.landlord?.signedBy}</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full ${tenantSigned ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-600">{tenantName}</span>
                {tenantSigned && (
                  <span className="text-xs text-green-700 font-medium">✓ Signed {contract.signatures?.tenant?.signedAt && `(${new Date(contract.signatures.tenant.signedAt).toLocaleDateString()})`}<br/>Signed by: {contract.signatures?.tenant?.signedBy}</span>
                )}
              </div>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-4">
            <button onClick={() => handleAction('approve')} disabled={isLoading || isRejected || isApproved || landlordApproved && tenantApproved} className="px-6 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 flex items-center gap-2">
              {isLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <span>✓</span>}
              Approve
            </button>
            <button onClick={() => setShowSignaturePad(true)} disabled={isLoading || !bothApproved || isRejected || (isCurrentLandlord && landlordSigned) || (isCurrentTenant && tenantSigned)} className="px-6 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 flex items-center gap-2">
              <span>✍️</span> Sign
            </button>
            <button onClick={() => handleAction('reject')} disabled={isLoading || isRejected || isApproved} className="px-6 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 flex items-center gap-2">
              {isLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <span>✕</span>}
              Reject
            </button>
            <button onClick={() => handleAction('download')} disabled={isLoading} className="px-6 py-2 rounded-lg text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 flex items-center gap-2">
              <span>⬇️</span> Download PDF
            </button>
          </div>
        </div>
      </div>
      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative">
            <button onClick={() => setShowSignaturePad(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            <h2 className="text-2xl font-bold text-green-900 mb-4">Sign Contract</h2>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Create Signature</h3>
              <SignaturePadWrapper
                ref={signaturePadRef}
                options={{ minWidth: 1, maxWidth: 3, penColor: 'rgb(16, 185, 129)', backgroundColor: '#f9fafb', width: 600, height: 180 }}
                style={{ borderRadius: '0.75rem', border: '1px solid #86efac', background: '#f9fafb' }}
              />
              <div className="flex gap-4 mt-2">
                <button type="button" onClick={handleSignSave} className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Save Signature</button>
                <button type="button" onClick={handleSignClear} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400">Clear</button>
                <button type="button" onClick={handleSignContract} disabled={isLoading || !signatureData} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">{isLoading ? 'Signing...' : 'Submit Signature'}</button>
              </div>
              {signatureData && (
                <div className="mt-3">
                  <img src={signatureData} alt="Signature Preview" className="h-12 border border-gray-300 rounded" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-lg shadow-lg text-sm font-medium ${notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>{notification.message}</div>
      )}
    </div>
  );
};

export default FAQCard; 