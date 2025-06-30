const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['apartment', 'house', 'condo', 'villa', 'studio', 'other'],
    required: true
  },
  purpose: {
    type: String,
    enum: ['rent', 'sale'],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  location: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: String,
    country: {
      type: String,
      default: 'USA'
    }
  },
  images: [{
    url: String,
    publicId: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  features: [{
    type: String,
    enum: [
      'parking', 'garden', 'balcony', 'elevator', 'security', 'furnished',
      'air_conditioning', 'heating', 'internet', 'gym', 'pool', 'pet_friendly'
    ]
  }],
  bedrooms: {
    type: Number,
    min: 0
  },
  bathrooms: {
    type: Number,
    min: 0
  },
  area: {
    size: Number,
    unit: {
      type: String,
      enum: ['sqft', 'sqm'],
      default: 'sqft'
    }
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    type: {
      type: String,
      enum: ['ownership_deed', 'property_tax', 'insurance', 'other']
    },
    url: String,
    filename: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['available', 'pending', 'rented', 'sold', 'inactive'],
    default: 'available'
  },
  views: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiryDate: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
    }
  }
}, {
  timestamps: true
});

// Index for search queries
propertySchema.index({ 
  title: 'text', 
  description: 'text',
  'location.city': 'text',
  'location.state': 'text'
});

// Virtual for primary image
propertySchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images[0] ? this.images[0].url : null);
});

// Method to increment views
propertySchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Static method for advanced search
propertySchema.statics.advancedSearch = function(filters) {
  const query = {
    status: 'available',
    isActive: true
  };

  if (filters.type) query.type = filters.type;
  if (filters.purpose) query.purpose = filters.purpose;
  if (filters.minPrice) query.price = { $gte: filters.minPrice };
  if (filters.maxPrice) {
    query.price = query.price || {};
    query.price.$lte = filters.maxPrice;
  }
  if (filters.bedrooms) query.bedrooms = { $gte: filters.bedrooms };
  if (filters.bathrooms) query.bathrooms = { $gte: filters.bathrooms };
  if (filters.verified) query.verified = filters.verified;

  return this.find(query).populate('sellerId', 'name email phone profileVerified');
};

module.exports = mongoose.model('Property', propertySchema); 