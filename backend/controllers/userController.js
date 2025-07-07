const User = require('../models/User');
const Property = require('../models/Property');
const mongoose = require('mongoose');

exports.getProfile = async (req, res) => {
  res.json({ user: req.user });
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = await User.findById(userId).select('name email profileImage phone address');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error in getUserById:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await Property.deleteMany({ owner: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.clearCookie('token');
    res.json({ message: 'Account and properties deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getSettings = async (req, res) => {
  try {
    res.json({ settings: req.user.settings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch settings.' });
  }
};


exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;
  
    Object.assign(req.user.settings, updates);
    await req.user.save();
    res.json({ settings: req.user.settings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update settings.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (name) req.user.name = name;
    if (email) req.user.email = email;
    if (phone) req.user.phone = phone;
    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile.' });
  }
};

// change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password required.' });
    }
    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }
    req.user.password = newPassword;
    await req.user.save();
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to change password.' });
  }
};

// update profile image
exports.updateProfileImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded.' });
    req.user.profileImage = `uploads/${req.file.filename}`;
    await req.user.save();
    res.json({ profileImage: req.user.profileImage });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile image.' });
  }
};

exports.saveSignature = async (req, res) => {
  try {
    const { signatureImage } = req.body;
    const userId = req.user._id;

    if (!signatureImage || typeof signatureImage !== 'string' || signatureImage.length < 100) {
      return res.status(400).json({ message: 'Valid signature image is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.signature = signatureImage;
    await user.save();

    res.json({ 
      message: 'Signature saved successfully',
      hasSignature: true 
    });
  } catch (error) {
    console.error('Error saving signature:', error);
    res.status(500).json({ message: 'Failed to save signature' });
  }
};


exports.getSignatureStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('signature');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      hasSignature: !!user.signature,
      signature: user.signature || null
    });
  } catch (error) {
    console.error('Error getting signature status:', error);
    res.status(500).json({ message: 'Failed to get signature status' });
  }
};


exports.deleteSignature = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.signature = undefined;
    await user.save();

    res.json({ 
      message: 'Signature deleted successfully',
      hasSignature: false 
    });
  } catch (error) {
    console.error('Error deleting signature:', error);
    res.status(500).json({ message: 'Failed to delete signature' });
  }
}; 