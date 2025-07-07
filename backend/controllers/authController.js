const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }
    
   
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });
    
    user = new User({ 
      name, 
      email, 
      password, 
      phone: phone || '', 
      address: address || '', 
      role 
    });
    await user.save();
    
    res.status(201).json({ 
      message: 'User registered successfully',
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = user.generateJWT();
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    res.json({ 
      token,
      user: { 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        phone: user.phone,
        address: user.address,
        profileImage: user.profileImage 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['buyer', 'seller'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    req.user.role = role;
    await req.user.save();
    res.json({ message: 'Role updated', role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 