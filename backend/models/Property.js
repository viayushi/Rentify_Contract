const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: mongoose.Schema.Types.Mixed, required: true },
  address: { type: String, required: true },
  propertyType: { type: String, required: true },
  images: [{ type: String }],
  owner: { type: mongoose.Schema.Types.Mixed, required: true }, // allow demo string or ObjectId
  status: { type: String, enum: ['listed', 'under_contract', 'rented'], default: 'listed' },
  bedrooms: { type: mongoose.Schema.Types.Mixed },
  bathrooms: { type: mongoose.Schema.Types.Mixed },
  area: { type: mongoose.Schema.Types.Mixed },
  furnishing: { type: String },
  petPolicy: { type: String },
  amenities: [{ type: String }],
  details: {
    address: String,
    furnishing: String,
    petPolicy: String,
    amenities: [String],
  },
}, { timestamps: true });

module.exports = mongoose.model('Property', propertySchema); 