const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, location } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    // Create new user
    const userData = {
      name,
      email,
      password,
      phone,
      role: role || 'buyer'
    };
    if (
      location &&
      typeof location === 'object' &&
      location.longitude !== undefined &&
      location.latitude !== undefined &&
      location.longitude !== '' &&
      location.latitude !== ''
    ) {
      userData.location = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
        address: location.address,
        city: location.city,
        state: location.state,
        zipCode: location.zipCode
      };
    }
    // Extra safety: remove location if coordinates are not valid
    if (userData.location && (!Array.isArray(userData.location.coordinates) || userData.location.coordinates.length !== 2)) {
      delete userData.location;
    }

    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated.' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, location } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (location) {
      updateData.location = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
        address: location.address,
        city: location.city,
        state: location.state,
        zipCode: location.zipCode
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update.' });
  }
});

// @route   POST /api/auth/upload-document
// @desc    Upload user document
// @access  Private
router.post('/upload-document', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { documentType } = req.body;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'user-documents',
        public_id: `${req.user._id}_${documentType}_${Date.now()}`
      },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: 'File upload failed.' });
        }

        // Add document to user
        const user = await User.findById(req.user._id);
        user.documents.push({
          type: documentType,
          url: result.secure_url,
          filename: req.file.originalname,
          uploadedAt: new Date()
        });

        await user.save();

        res.json({
          message: 'Document uploaded successfully',
          document: {
            type: documentType,
            url: result.secure_url,
            filename: req.file.originalname
          }
        });
      }
    ).end(req.file.buffer);
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ message: 'Server error during document upload.' });
  }
});

// @route   POST /api/auth/upload-profile-image
// @desc    Upload profile image
// @access  Private
router.post('/upload-profile-image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded.' });
    }

    // Delete old profile image if exists
    if (req.user.profileImage?.publicId) {
      await cloudinary.uploader.destroy(req.user.profileImage.publicId);
    }

    // Upload new image to Cloudinary
    const result = await cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'profile-images',
        public_id: `profile_${req.user._id}_${Date.now()}`,
        transformation: [
          { width: 300, height: 300, crop: 'fill' }
        ]
      },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: 'Image upload failed.' });
        }

        // Update user profile image
        const user = await User.findByIdAndUpdate(
          req.user._id,
          {
            profileImage: {
              url: result.secure_url,
              publicId: result.public_id
            }
          },
          { new: true }
        ).select('-password');

        res.json({
          message: 'Profile image uploaded successfully',
          profileImage: user.profileImage
        });
      }
    ).end(req.file.buffer);
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ message: 'Server error during image upload.' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error during password change.' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router; 