import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import ContractPreview from '../../../legal-chat-agreements/src/components/ContractPreview';
import { fetchOrderById } from '../store/slices/orderSlice';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const LegalContractPage = () => {
  const { user } = useSelector((state) => state.auth);
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const { currentOrder, loading } = useSelector((state) => state.order);
  const currentUser = user?.userType === 'landlord' ? 'seller' : 'buyer';

  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderById(orderId));
    }
  }, [dispatch, orderId]);

  if (loading || !currentOrder) {
    return <LoadingSpinner size="lg" />;
  }

  // Map backend order fields to ContractPreview props
  const orderData = {
    title: currentOrder.property?.title || 'Order',
    propertyType: currentOrder.property?.type || '',
    amount: currentOrder.priceAgreed || currentOrder.property?.price || 0,
    timeline: currentOrder.duration ? `${currentOrder.duration} months` : '',
    description: currentOrder.property?.description || '',
    deliverables: 'Keys, Documents', // You can enhance this
    paymentTerms: currentOrder.paymentTerms || 'Monthly',
    cancellationPolicy: currentOrder.cancellationPolicy || '30 days notice',
    legalTerms: currentOrder.legalTerms || 'Standard legal terms apply.',
    disputeResolution: currentOrder.disputeResolution || 'Arbitration'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8">
        <ContractPreview 
          orderData={orderData} 
          currentUser={currentUser} 
          onApprove={() => {}} 
          onReject={() => {}} 
        />
      </div>
    </div>
  );
};

export default LegalContractPage; 