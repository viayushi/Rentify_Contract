const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['buyer', 'seller'], default: 'buyer' },
  profileImage: { type: String },
  phone: { type: String },
  address: { type: String },
  signature: { type: String },
  settings: {
    theme: { type: String, default: 'light' },
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateJWT = function () {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
  return jwt.sign({ id: this._id, role: this.role }, secret, { expiresIn: '7d' });
};

module.exports = mongoose.model('User', userSchema); 