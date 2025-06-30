const mongoose = require('mongoose');

const agreementSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
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
  agreementType: {
    type: String,
    enum: ['rental', 'sale'],
    required: true
  },
  agreementNumber: {
    type: String,
    unique: true
  },
  terms: {
    rentAmount: Number,
    securityDeposit: Number,
    duration: Number, // in months
    startDate: Date,
    endDate: Date,
    paymentSchedule: {
      type: String,
      enum: ['monthly', 'quarterly', 'annually'],
      default: 'monthly'
    },
    utilities: [{
      type: String,
      enum: ['electricity', 'water', 'gas', 'internet', 'maintenance']
    }],
    specialConditions: [String]
  },
  buyerSignature: {
    signature: String, // Base64 encoded signature
    signedAt: Date,
    ipAddress: String,
    userAgent: String
  },
  sellerSignature: {
    signature: String, // Base64 encoded signature
    signedAt: Date,
    ipAddress: String,
    userAgent: String
  },
  documentUrl: String,
  documentPublicId: String, // For cloud storage
  status: {
    type: String,
    enum: ['draft', 'pending_buyer_signature', 'pending_seller_signature', 'completed', 'expired'],
    default: 'draft'
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from creation
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
agreementSchema.index({ orderId: 1 });
agreementSchema.index({ buyerId: 1, status: 1 });
agreementSchema.index({ sellerId: 1, status: 1 });
agreementSchema.index({ agreementNumber: 1 });

// Generate agreement number
agreementSchema.pre('save', async function(next) {
  if (!this.agreementNumber) {
    const count = await this.constructor.countDocuments();
    this.agreementNumber = `AGR-${Date.now()}-${count + 1}`;
  }
  next();
});

// Method to add buyer signature
agreementSchema.methods.addBuyerSignature = function(signature, ipAddress, userAgent) {
  this.buyerSignature = {
    signature,
    signedAt: new Date(),
    ipAddress,
    userAgent
  };
  
  if (this.sellerSignature.signature) {
    this.status = 'completed';
  } else {
    this.status = 'pending_seller_signature';
  }
  
  return this.save();
};

// Method to add seller signature
agreementSchema.methods.addSellerSignature = function(signature, ipAddress, userAgent) {
  this.sellerSignature = {
    signature,
    signedAt: new Date(),
    ipAddress,
    userAgent
  };
  
  if (this.buyerSignature.signature) {
    this.status = 'completed';
  } else {
    this.status = 'pending_buyer_signature';
  }
  
  return this.save();
};

// Method to check if agreement is fully signed
agreementSchema.methods.isFullySigned = function() {
  return this.buyerSignature.signature && this.sellerSignature.signature;
};

// Method to check if agreement is expired
agreementSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Static method to get agreements for a user
agreementSchema.statics.getUserAgreements = function(userId, role, status = null) {
  const query = role === 'buyer' 
    ? { buyerId: userId, isActive: true }
    : { sellerId: userId, isActive: true };
    
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .populate('orderId', 'priceAgreed chatSummary')
    .populate('propertyId', 'title location price')
    .populate('buyerId', 'name email')
    .populate('sellerId', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get expired agreements
agreementSchema.statics.getExpiredAgreements = function() {
  return this.find({
    status: { $in: ['draft', 'pending_buyer_signature', 'pending_seller_signature'] },
    expiresAt: { $lt: new Date() },
    isActive: true
  });
};

module.exports = mongoose.model('Agreement', agreementSchema); 