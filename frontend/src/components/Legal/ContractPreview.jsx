import React, { useState } from 'react';
import { FileText, Check, X, AlertTriangle, Camera, Upload } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Separator } from './separator';
import { Input } from './input';
import { Label } from './label';
import { useContracts } from '../../hooks/useContracts';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';

const ContractPreview = ({ orderData, currentUser, onApprove, onReject }) => {
  const [passportPhoto, setPassportPhoto] = useState(null);
  const { updateContract } = useContracts();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleApproval = async () => {
    if (!orderData?.id) return;
    
    setLoading(true);
    try {
      const updateField = currentUser === 'buyer' ? 'buyer_approved' : 'seller_approved';
      const { error } = await updateContract(orderData.id, {
        [updateField]: true,
        status: 'pending_approval'
      });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Contract approved successfully!',
      });
      
      onApprove();
    } catch (error) {
      console.error('Error approving contract:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve contract. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPassportPhoto(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const contractSections = [
    {
      title: 'Transaction Details',
      content: [
        { label: 'Order Title', value: orderData.title },
        { label: 'Property Type', value: orderData.property_type },
        { label: 'Transaction Amount', value: `$${orderData.amount}` },
        { label: 'Timeline', value: orderData.timeline }
      ]
    },
    {
      title: 'Description & Deliverables',
      content: [
        { label: 'Description', value: orderData.description },
        { label: 'Deliverables', value: orderData.deliverables }
      ]
    },
    {
      title: 'Financial Terms',
      content: [
        { label: 'Payment Terms', value: orderData.payment_terms },
        { label: 'Cancellation Policy', value: orderData.cancellation_policy }
      ]
    },
    {
      title: 'Legal Terms',
      content: [
        { label: 'Legal Terms & Conditions', value: orderData.legal_terms },
        { label: 'Dispute Resolution', value: orderData.dispute_resolution }
      ]
    }
  ];

  const bothPartiesApproved = orderData.buyer_approved && orderData.seller_approved;
  const currentUserApproved = currentUser === 'buyer' ? orderData.buyer_approved : orderData.seller_approved;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <FileText className="h-6 w-6 mr-2" />
            Contract Preview
          </h2>
          <p className="text-gray-600">
            Review all terms before approval. Both parties must approve to proceed.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Approval Status</p>
            <div className="flex items-center space-x-2">
              <Badge variant={orderData.buyer_approved ? "default" : "secondary"}>
                Buyer {orderData.buyer_approved ? '✓' : '○'}
              </Badge>
              <Badge variant={orderData.seller_approved ? "default" : "secondary"}>
                Seller {orderData.seller_approved ? '✓' : '○'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-2">
        <CardHeader className="bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-center">Legal Agreement Contract</CardTitle>
              <p className="text-center text-sm text-gray-600">
                This contract is legally binding upon approval by both parties
              </p>
            </div>
            <div className="ml-4">
              <div className="w-24 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-white">
                {passportPhoto ? (
                  <img 
                    src={passportPhoto} 
                    alt="Passport Photo" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <>
                    <Camera className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500 text-center">Passport Photo</span>
                  </>
                )}
              </div>
              <div className="mt-2">
                <Input
                  id="passport-photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Label htmlFor="passport-photo" className="cursor-pointer">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <Upload className="h-3 w-3 mr-1" />
                    Upload
                  </Button>
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {contractSections.map((section, index) => (
            <div key={index} className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">
                {section.title}
              </h3>
              <div className="space-y-3">
                {section.content.map((item, itemIndex) => (
                  <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="font-medium text-gray-700">{item.label}:</div>
                    <div className="md:col-span-2 text-gray-900">
                      {item.value || 'Not specified'}
                    </div>
                  </div>
                ))}
              </div>
              {index < contractSections.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800">Important Legal Notice</h4>
                <p className="text-yellow-700 text-sm mt-1">
                  By approving this contract, you agree to be legally bound by all terms and conditions 
                  outlined above. This agreement will be enforceable under applicable law. Please review 
                  carefully and consult legal counsel if needed.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!currentUserApproved ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">
                Your Approval as {currentUser.charAt(0).toUpperCase() + currentUser.slice(1)}
              </h3>
              <p className="text-gray-600">
                Please review all terms carefully before making your decision
              </p>
              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={onReject}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject Contract
                </Button>
                <Button 
                  onClick={handleApproval}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {loading ? 'Approving...' : 'Approve Contract'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : bothPartiesApproved ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800">
              Both Parties Approved - Ready for Signature!
            </h3>
            <p className="text-green-700">
              Both buyer and seller have approved the contract. You can now proceed to sign the document.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <Check className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-800">
              Your Approval Recorded
            </h3>
            <p className="text-blue-700">
              Waiting for {currentUser === 'buyer' ? 'seller' : 'buyer'} approval before proceeding to signature.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContractPreview;
