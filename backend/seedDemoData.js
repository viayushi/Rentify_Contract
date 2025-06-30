// Usage: node seedDemoData.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Property = require('./models/Property');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/property-listing';

async function seed() {
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Property.deleteMany({});

  // Create demo users
  const users = await User.insertMany([
    {
      name: 'Alice Buyer',
      email: 'alice@example.com',
      password: 'password123',
      phone: '1234567890',
      role: 'buyer',
    },
    {
      name: 'Bob Seller',
      email: 'bob@example.com',
      password: 'password123',
      phone: '2345678901',
      role: 'seller',
    },
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'adminpass',
      phone: '3456789012',
      role: 'admin',
    },
  ]);

  const seller = users.find(u => u.role === 'seller');

  // Create demo properties for seller
  await Property.insertMany([
    {
      title: 'Cozy Apartment',
      description: 'A nice and cozy apartment in the city center.',
      type: 'apartment',
      purpose: 'rent',
      price: 1200,
      currency: 'USD',
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716],
        address: 'MG Road',
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: '560001',
        country: 'India',
      },
      features: ['2 BHK', 'Furnished', 'Balcony'],
      bedrooms: 2,
      bathrooms: 2,
      area: 900,
      sellerId: seller._id,
      images: [],
      verificationDocuments: [],
      status: 'available',
    },
    {
      title: 'Spacious Villa',
      description: 'A luxurious villa with a private pool.',
      type: 'villa',
      purpose: 'sale',
      price: 250000,
      currency: 'USD',
      location: {
        type: 'Point',
        coordinates: [77.6200, 12.9500],
        address: 'Whitefield',
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: '560066',
        country: 'India',
      },
      features: ['4 BHK', 'Pool', 'Garden'],
      bedrooms: 4,
      bathrooms: 4,
      area: 3500,
      sellerId: seller._id,
      images: [],
      verificationDocuments: [],
      status: 'available',
    },
  ]);

  console.log('Demo users and properties created!');
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seed().catch(err => {
  console.error('Seeding error:', err);
  mongoose.disconnect();
}); 