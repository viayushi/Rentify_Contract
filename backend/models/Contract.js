const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  contractId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  propertyId: {
    type: String,
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  landlordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  monthlyRent: {
    type: Number,
    required: true,
    min: 0
  },
  securityDeposit: {
    type: Number,
    required: true,
    min: 0
  },
  
  propertyAddress: {
    type: String,
    required: true
  },
  tenantDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true }
  },
  landlordDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true }
  },
  
  terms: {
    type: String,
    required: true
  },
  conditions: {
    type: String,
    default: ''
  },
  
  placeOfExecution: {
    type: String,
    required: true
  },
  witnessName: {
    type: String,
    default: ''
  },
  witnessAddress: {
    type: String,
    default: ''
  },
  
  status: {
    type: String,
    enum: ['pending_approval', 'landlord_approved', 'tenant_approved', 'approved', 'rejected', 'expired'],
    default: 'pending_approval'
  },
  
  signatures: {
    landlord: {
      signed: { type: Boolean, default: false },
      signedAt: { type: Date },
      signatureText: { type: String },
      signatureImage: { type: String },
      ipAddress: { type: String },
      userAgent: { type: String },
      verificationCode: { type: String }
    },
    tenant: {
      signed: { type: Boolean, default: false },
      signedAt: { type: Date },
      signatureText: { type: String },
      signatureImage: { type: String },
      ipAddress: { type: String },
      userAgent: { type: String },
      verificationCode: { type: String }
    },
    witness: {
      signed: { type: Boolean, default: false },
      signedAt: { type: Date },
      signatureText: { type: String },
      signatureImage: { type: String },
      ipAddress: { type: String },
      userAgent: { type: String },
      verificationCode: { type: String }
    }
  },
  
  approvals: {
    landlord: {
      approved: { type: Boolean, default: false },
      approvedAt: { type: Date },
      feedback: { type: String },
      ipAddress: { type: String }
    },
    tenant: {
      approved: { type: Boolean, default: false },
      approvedAt: { type: Date },
      feedback: { type: String },
      ipAddress: { type: String }
    }
  },
  
  documents: {
    tenant: {
      aadhaar: { type: String },
      pan: { type: String },
      idProof: { type: String },
      bankPassbook: { type: String },
      photo: { type: String }
    },
    landlord: {
      propertyOwnership: { type: String },
      propertyRegistration: { type: String },
      photo: { type: String }
    }
  },
  
  digitalHash: {
    type: String,
    required: true
  },
  pdfUrl: {
    type: String
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  
  contractStatus: {
    current: {
      type: String,
      enum: [
        'draft',
        'pending_landlord_signature',
        'pending_tenant_signature',
        'pending_witness_signature',
        'landlord_approved',
        'tenant_approved',
        'rejected',
        'fully_signed',
        'active',
        'completed',
        'terminated',
        'expired',
        'approved'
      ],
      default: 'draft'
    },
    history: [{
      status: { type: String, required: true },
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason: { type: String },
      ipAddress: { type: String }
    }],
    lastUpdated: { type: Date, default: Date.now }
  },
  
  bedrooms: { type: Number, required: true },
  fans: { type: Number, required: true },
  lights: { type: Number, required: true },
  geysers: { type: Number, required: true },
  mirrors: { type: Number, required: true },
  taps: { type: Number, required: true },
  maintenanceCharges: { type: Number, required: true },

  landlordFatherName: { type: String, required: true },
  tenantFatherName: { type: String, required: true },
  tenantOccupation: { type: String, required: true }, // working at / studying at
}, {
  timestamps: true
});

contractSchema.methods.generateHash = function() {
  const crypto = require('crypto');
  const contractString = JSON.stringify({
    contractId: this.contractId,
    propertyId: this.propertyId,
    tenantId: this.tenantId,
    landlordId: this.landlordId,
    startDate: this.startDate,
    endDate: this.endDate,
    monthlyRent: this.monthlyRent,
    securityDeposit: this.securityDeposit,
    createdAt: this.createdAt
  });
  
  return crypto.createHash('sha256').update(contractString).digest('hex');
};

//save middleware to generate hash
contractSchema.pre('save', function(next) {
  if (this.isNew || this.isModified()) {
    this.digitalHash = this.generateHash();
    this.updatedAt = new Date();
  }
  next();
});


contractSchema.virtual('durationMonths').get(function() {
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30));
});

// Virtual for total contract value
contractSchema.virtual('totalValue').get(function() {
  return (this.monthlyRent * this.durationMonths) + this.securityDeposit;
});

// Indexes for better query performance
contractSchema.index({ landlordId: 1, status: 1 });
contractSchema.index({ tenantId: 1, status: 1 });
contractSchema.index({ propertyId: 1 });
contractSchema.index({ createdAt: -1 });
contractSchema.index({ status: 1, createdAt: -1 });

contractSchema.methods.updateStatus = function(newStatus, changedBy, reason = '', ipAddress = '') {

  const finalStates = ['approved', 'fully_signed', 'completed', 'terminated'];
  if (finalStates.includes(this.contractStatus.current)) {
    console.warn(`Attempted to change status of finalized contract (${this.contractId}) from ${this.contractStatus.current} to ${newStatus}. Ignored.`);
    return Promise.resolve(this); // No-op
  }
  this.contractStatus.current = newStatus;
  this.contractStatus.history.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy: changedBy,
    reason: reason,
    ipAddress: ipAddress
  });
  this.contractStatus.lastUpdated = new Date();
  return this.save();
};

contractSchema.methods.isFullySigned = function() {
  const landlordSigned = this.signatures.landlord.signed;
  const tenantSigned = this.signatures.tenant.signed;
  const witnessSigned = this.witnessName ? this.signatures.witness.signed : true;
  
  return landlordSigned && tenantSigned && witnessSigned;
};



contractSchema.methods.getNextRequiredSignature = function() {
  if (!this.signatures.landlord.signed) return 'landlord';
  if (!this.signatures.tenant.signed) return 'tenant';
  if (this.witnessName && !this.signatures.witness.signed) return 'witness';
  return null;
};

contractSchema.methods.generateVerificationCode = function() {
  const crypto = require('crypto');
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Method to verify signature
contractSchema.methods.verifySignature = function(role, verificationCode) {
  return this.signatures[role].verificationCode === verificationCode;
};
contractSchema.methods.getSummary = function() {
  return {
    contractId: this.contractId,
    propertyAddress: this.propertyAddress,
    landlordName: this.landlordDetails.name,
    tenantName: this.tenantDetails.name,
    status: this.contractStatus.current,
    monthlyRent: this.monthlyRent,
    startDate: this.startDate,
    endDate: this.endDate,
    isFullySigned: this.isFullySigned(),
    nextSignature: this.getNextRequiredSignature()
  };
};
contractSchema.statics.getByStatus = function(status, userId) {
  return this.find({
    'contractStatus.current': status,
    $or: [{ landlordId: userId }, { tenantId: userId }]
  }).populate('propertyId tenantId landlordId');
};
contractSchema.statics.getPendingSignatures = function(userId) {
  return this.find({
    $or: [
      { landlordId: userId, 'signatures.landlord.signed': false },
      { tenantId: userId, 'signatures.tenant.signed': false }
    ]
  }).populate('propertyId tenantId landlordId');
};

module.exports = mongoose.model('Contract', contractSchema); 