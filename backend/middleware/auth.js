const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    res.status(500).json({ message: 'Server error.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. User not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

const checkOwnership = (model, field = 'userId') => {
  return async (req, res, next) => {
    try {
      const resource = await model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found.' });
      }

      if (resource[field].toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Not authorized.' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  };
};

const checkPropertyAccess = async (req, res, next) => {
  try {
    const Property = require('../models/Property');
    const property = await Property.findById(req.params.propertyId);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found.' });
    }

    // Allow access if user is the seller, admin, or if property is available
    if (property.sellerId.toString() === req.user._id.toString() || 
        req.user.role === 'admin' || 
        property.status === 'available') {
      req.property = property;
      next();
    } else {
      return res.status(403).json({ message: 'Access denied to this property.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const checkOrderAccess = async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Allow access if user is buyer, seller, or admin
    if (order.buyerId.toString() === req.user._id.toString() || 
        order.sellerId.toString() === req.user._id.toString() || 
        req.user.role === 'admin') {
      req.order = order;
      next();
    } else {
      return res.status(403).json({ message: 'Access denied to this order.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  auth,
  authorize,
  checkOwnership,
  checkPropertyAccess,
  checkOrderAccess
}; 