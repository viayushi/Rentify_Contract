const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rentify';

const sampleUsers = [
  {
    name: 'Rahul Sharma',
    email: 'rahul.sharma@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543210',
    address: 'Mumbai, Maharashtra',
    profileImage: 'https://ui-avatars.com/api/?name=Rahul+Sharma&background=3c7655&color=fff'
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543211',
    address: 'Bangalore, Karnataka',
    profileImage: 'https://ui-avatars.com/api/?name=Priya+Patel&background=3c7655&color=fff'
  },
  {
    name: 'Arjun Singh',
    email: 'arjun.singh@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543212',
    address: 'Pune, Maharashtra',
    profileImage: 'https://ui-avatars.com/api/?name=Arjun+Singh&background=3c7655&color=fff'
  },
  {
    name: 'Meera Reddy',
    email: 'meera.reddy@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543213',
    address: 'Hyderabad, Telangana',
    profileImage: 'https://ui-avatars.com/api/?name=Meera+Reddy&background=3c7655&color=fff'
  },
  {
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543214',
    address: 'Gurgaon, Haryana',
    profileImage: 'https://ui-avatars.com/api/?name=Vikram+Malhotra&background=3c7655&color=fff'
  },
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543215',
    address: 'Jaipur, Rajasthan',
    profileImage: 'https://ui-avatars.com/api/?name=Rajesh+Kumar&background=3c7655&color=fff'
  },
  {
    name: 'Anjali Gupta',
    email: 'anjali.gupta@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543216',
    address: 'Delhi, Delhi',
    profileImage: 'https://ui-avatars.com/api/?name=Anjali+Gupta&background=3c7655&color=fff'
  },
  {
    name: 'Suresh Patel',
    email: 'suresh.patel@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543217',
    address: 'Ahmedabad, Gujarat',
    profileImage: 'https://ui-avatars.com/api/?name=Suresh+Patel&background=3c7655&color=fff'
  },
  {
    name: 'Harpreet Kaur',
    email: 'harpreet.kaur@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543218',
    address: 'Chandigarh, Chandigarh',
    profileImage: 'https://ui-avatars.com/api/?name=Harpreet+Kaur&background=3c7655&color=fff'
  },
  {
    name: 'Amit Verma',
    email: 'amit.verma@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543219',
    address: 'Lucknow, Uttar Pradesh',
    profileImage: 'https://ui-avatars.com/api/?name=Amit+Verma&background=3c7655&color=fff'
  },
  {
    name: 'Neha Sharma',
    email: 'neha.sharma@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543220',
    address: 'Indore, Madhya Pradesh',
    profileImage: 'https://ui-avatars.com/api/?name=Neha+Sharma&background=3c7655&color=fff'
  },
  {
    name: 'Thomas Mathew',
    email: 'thomas.mathew@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543221',
    address: 'Kochi, Kerala',
    profileImage: 'https://ui-avatars.com/api/?name=Thomas+Mathew&background=3c7655&color=fff'
  },
  {
    name: 'Ravi Shukla',
    email: 'ravi.shukla@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543222',
    address: 'Bhopal, Madhya Pradesh',
    profileImage: 'https://ui-avatars.com/api/?name=Ravi+Shukla&background=3c7655&color=fff'
  },
  {
    name: 'Maria Fernandes',
    email: 'maria.fernandes@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543223',
    address: 'Goa, Goa',
    profileImage: 'https://ui-avatars.com/api/?name=Maria+Fernandes&background=3c7655&color=fff'
  },
  {
    name: 'Ketan Shah',
    email: 'ketan.shah@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543224',
    address: 'Surat, Gujarat',
    profileImage: 'https://ui-avatars.com/api/?name=Ketan+Shah&background=3c7655&color=fff'
  },
  {
    name: 'Deepak Agarwal',
    email: 'deepak.agarwal@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543225',
    address: 'Noida, Uttar Pradesh',
    profileImage: 'https://ui-avatars.com/api/?name=Deepak+Agarwal&background=3c7655&color=fff'
  },
  {
    name: 'Lakshmi Devi',
    email: 'lakshmi.devi@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543226',
    address: 'Mysore, Karnataka',
    profileImage: 'https://ui-avatars.com/api/?name=Lakshmi+Devi&background=3c7655&color=fff'
  },
  {
    name: 'Gurpreet Singh',
    email: 'gurpreet.singh@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543227',
    address: 'Chandigarh, Chandigarh',
    profileImage: 'https://ui-avatars.com/api/?name=Gurpreet+Singh&background=3c7655&color=fff'
  },
  {
    name: 'Vishal Tiwari',
    email: 'vishal.tiwari@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543228',
    address: 'Kanpur, Uttar Pradesh',
    profileImage: 'https://ui-avatars.com/api/?name=Vishal+Tiwari&background=3c7655&color=fff'
  },
  {
    name: 'Rajiv Kumar',
    email: 'rajiv.kumar@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543229',
    address: 'Patna, Bihar',
    profileImage: 'https://ui-avatars.com/api/?name=Rajiv+Kumar&background=3c7655&color=fff'
  },
  {
    name: 'Sreekumar Nair',
    email: 'sreekumar.nair@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543230',
    address: 'Thiruvananthapuram, Kerala',
    profileImage: 'https://ui-avatars.com/api/?name=Sreekumar+Nair&background=3c7655&color=fff'
  },
  {
    name: 'Aditya Joshi',
    email: 'aditya.joshi@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543231',
    address: 'Pune, Maharashtra',
    profileImage: 'https://ui-avatars.com/api/?name=Aditya+Joshi&background=3c7655&color=fff'
  },
  {
    name: 'Prakash Deshmukh',
    email: 'prakash.deshmukh@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543232',
    address: 'Nagpur, Maharashtra',
    profileImage: 'https://ui-avatars.com/api/?name=Prakash+Deshmukh&background=3c7655&color=fff'
  },
  {
    name: 'Karthik Rajan',
    email: 'karthik.rajan@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543233',
    address: 'Coimbatore, Tamil Nadu',
    profileImage: 'https://ui-avatars.com/api/?name=Karthik+Rajan&background=3c7655&color=fff'
  },
  {
    name: 'Soumitra Chatterjee',
    email: 'soumitra.chatterjee@email.com',
    password: 'password123',
    role: 'seller',
    phone: '9876543234',
    address: 'Kolkata, West Bengal',
    profileImage: 'https://ui-avatars.com/api/?name=Soumitra+Chatterjee&background=3c7655&color=fff'
  },
];

async function createSampleUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing users (optional - remove this if you want to keep existing users)
    // await User.deleteMany({});
    // console.log('Cleared existing users');

    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.email} already exists`);
        createdUsers.push(existingUser);
        continue;
      }

      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.email} with ID: ${user._id}`);
      createdUsers.push(user);
    }

    console.log('\n=== Created Users with IDs ===');
    createdUsers.forEach(user => {
      console.log(`${user.name} (${user.email}): ${user._id}`);
    });

    console.log('\nSample users created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample users:', error);
    process.exit(1);
  }
}

createSampleUsers(); 