const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  chatSummary: {
    type: String,
    required: true
  },
  priceAgreed: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  duration: {
    type: Number,
    min: 1
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  buyerDetails: {
    familySize: Number,
    occupation: String,
    income: Number,
    references: [{
      name: String,
      phone: String,
      email: String,
      relationship: String
    }]
  },
  buyerDocuments: [{
    type: {
      type: String,
      enum: ['id', 'passport', 'driving_license', 'income_proof', 'bank_statement', 'reference_letter', 'other']
    },
    url: String,
    filename: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'approved', 'rejected', 'payment_pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  sellerConditions: [{
    condition: String,
    isRequired: {
      type: Boolean,
      default: true
    },
    isMet: {
      type: Boolean,
      default: false
    }
  }],
  sellerNotes: String,
  rejectionReason: String,
  paymentDetails: {
    amount: Number,
    currency: String,
    paymentMethod: String,
    transactionId: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentDate: Date
  },
  agreementSigned: {
    buyer: {
      type: Boolean,
      default: false
    },
    seller: {
      type: Boolean,
      default: false
    },
    signedAt: Date
  },
  agreementDocument: {
    url: String,
    filename: String,
    generatedAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  completedAt: Date,
  cancelledAt: Date
}, {
  timestamps: true
});

orderSchema.index({ buyerId: 1, status: 1 });
orderSchema.index({ sellerId: 1, status: 1 });
orderSchema.index({ propertyId: 1 });
orderSchema.index({ createdAt: -1 });

orderSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
  this.status = newStatus;
  
  if (newStatus === 'completed') {
    this.completedAt = new Date();
  } else if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
  }
  
  Object.assign(this, additionalData);
  return this.save();
};

orderSchema.methods.addSellerConditions = function(conditions) {
  this.sellerConditions = conditions;
  this.status = 'reviewing';
  return this.save();
};

orderSchema.methods.markConditionMet = function(conditionIndex) {
  if (this.sellerConditions[conditionIndex]) {
    this.sellerConditions[conditionIndex].isMet = true;
  }
  return this.save();
};

orderSchema.methods.updatePaymentDetails = function(paymentData) {
  this.paymentDetails = { ...this.paymentDetails, ...paymentData };
  if (paymentData.paymentStatus === 'completed') {
    this.status = 'payment_pending';
  }
  return this.save();
};

orderSchema.methods.signAgreement = function(role) {
  if (role === 'buyer') {
    this.agreementSigned.buyer = true;
  } else if (role === 'seller') {
    this.agreementSigned.seller = true;
  }
  
  if (this.agreementSigned.buyer && this.agreementSigned.seller) {
    this.agreementSigned.signedAt = new Date();
    this.status = 'completed';
  }
  
  return this.save();
};

orderSchema.statics.getUserOrders = function(userId, role, status = null) {
  const query = role === 'buyer' 
    ? { buyerId: userId, isActive: true }
    : { sellerId: userId, isActive: true };
    
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .populate('propertyId', 'title images location price type purpose')
    .populate('buyerId', 'name email phone profileImage')
    .populate('sellerId', 'name email phone profileImage')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Order', orderSchema); 