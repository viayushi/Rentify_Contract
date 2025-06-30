const express = require('express');
const Order = require('../models/Order');
const Message = require('../models/Message');
const Property = require('../models/Property');
const { auth, authorize, checkOrderAccess } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// @route   POST /api/orders/create-from-chat
// @desc    Create order from conversation
// @access  Private
router.post('/create-from-chat', auth, async (req, res) => {
  try {
    const { conversationId, chatSummary, priceAgreed, buyerDetails, duration, startDate, endDate } = req.body;

    // Get conversation
    const conversation = await Message.findById(conversationId)
      .populate('propertyId')
      .populate('buyerId')
      .populate('sellerId');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    // Check if user is the buyer
    if (conversation.buyerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only buyers can create orders.' });
    }

    // Check if property is still available
    if (conversation.propertyId.status !== 'available') {
      return res.status(400).json({ message: 'Property is no longer available.' });
    }

    // Create order
    const order = new Order({
      buyerId: conversation.buyerId._id,
      sellerId: conversation.sellerId._id,
      propertyId: conversation.propertyId._id,
      conversationId: conversation._id,
      chatSummary,
      priceAgreed,
      duration,
      startDate,
      endDate,
      buyerDetails
    });

    await order.save();

    // Update property status to pending
    await Property.findByIdAndUpdate(conversation.propertyId._id, { status: 'pending' });

    // Populate order data
    await order.populate([
      { path: 'propertyId', select: 'title images location price type purpose' },
      { path: 'buyerId', select: 'name email phone profileImage' },
      { path: 'sellerId', select: 'name email phone profileImage' }
    ]);

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error during order creation.' });
  }
});

// @route   POST /api/orders
// @desc    Create order directly from property
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { propertyId, startDate, endDate, buyerDetails, priceAgreed } = req.body;

    // Get property
    const property = await Property.findById(propertyId).populate('sellerId');
    if (!property) {
      return res.status(404).json({ message: 'Property not found.' });
    }

    // Check if property is available
    if (property.status !== 'available') {
      return res.status(400).json({ message: 'Property is no longer available.' });
    }

    // Check if user is not the seller
    if (property.sellerId._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'Sellers cannot create orders for their own properties.' });
    }

    // Create order
    const order = new Order({
      buyerId: req.user._id,
      sellerId: property.sellerId._id,
      propertyId: property._id,
      startDate,
      endDate,
      buyerDetails,
      priceAgreed: priceAgreed || property.price,
      status: 'pending'
    });

    await order.save();

    // Update property status to pending
    await Property.findByIdAndUpdate(propertyId, { status: 'pending' });

    // Populate order data
    await order.populate([
      { path: 'propertyId', select: 'title images location price type purpose' },
      { path: 'buyerId', select: 'name email phone profileImage' },
      { path: 'sellerId', select: 'name email phone profileImage' }
    ]);

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error during order creation.' });
  }
});

// @route   GET /api/orders/my-orders
// @desc    Get user's orders
// @access  Private
router.get('/my-orders', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const orders = await Order.getUserOrders(req.user._id, req.user.role, status);
    
    // Pagination
    const total = orders.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedOrders = orders.slice(startIndex, endIndex);

    res.json({
      orders: paginatedOrders,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error during orders fetch.' });
  }
});

// @route   GET /api/orders/:orderId
// @desc    Get order by ID
// @access  Private
router.get('/:orderId', auth, checkOrderAccess, async (req, res) => {
  try {
    const order = req.order;
    
    // Populate order data
    await order.populate([
      { path: 'propertyId', select: 'title images location price type purpose sellerId' },
      { path: 'buyerId', select: 'name email phone profileImage' },
      { path: 'sellerId', select: 'name email phone profileImage' },
      { path: 'conversationId', select: 'messages' }
    ]);

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error during order fetch.' });
  }
});

// @route   PUT /api/orders/:orderId/approve
// @desc    Approve order (seller only)
// @access  Private
router.put('/:orderId/approve', auth, checkOrderAccess, async (req, res) => {
  try {
    const order = req.order;
    
    // Check if user is the seller
    if (order.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only sellers can approve orders.' });
    }

    // Check if order is in pending status
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order cannot be approved in current status.' });
    }

    await order.updateStatus('approved');

    res.json({
      message: 'Order approved successfully',
      order
    });
  } catch (error) {
    console.error('Approve order error:', error);
    res.status(500).json({ message: 'Server error during order approval.' });
  }
});

// @route   PUT /api/orders/:orderId/reject
// @desc    Reject order (seller only)
// @access  Private
router.put('/:orderId/reject', auth, checkOrderAccess, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const order = req.order;
    
    // Check if user is the seller
    if (order.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only sellers can reject orders.' });
    }

    // Check if order is in pending status
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order cannot be rejected in current status.' });
    }

    await order.updateStatus('rejected', { rejectionReason });

    // Update property status back to available
    await Property.findByIdAndUpdate(order.propertyId, { status: 'available' });

    res.json({
      message: 'Order rejected successfully',
      order
    });
  } catch (error) {
    console.error('Reject order error:', error);
    res.status(500).json({ message: 'Server error during order rejection.' });
  }
});

// @route   PUT /api/orders/:orderId/add-conditions
// @desc    Add seller conditions to order
// @access  Private
router.put('/:orderId/add-conditions', auth, checkOrderAccess, async (req, res) => {
  try {
    const { conditions, sellerNotes } = req.body;
    const order = req.order;
    
    // Check if user is the seller
    if (order.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only sellers can add conditions.' });
    }

    // Check if order is in pending status
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Conditions cannot be added in current status.' });
    }

    await order.addSellerConditions(conditions);
    
    if (sellerNotes) {
      order.sellerNotes = sellerNotes;
      await order.save();
    }

    res.json({
      message: 'Conditions added successfully',
      order
    });
  } catch (error) {
    console.error('Add conditions error:', error);
    res.status(500).json({ message: 'Server error during conditions addition.' });
  }
});

// @route   PUT /api/orders/:orderId/mark-condition-met
// @desc    Mark condition as met (buyer only)
// @access  Private
router.put('/:orderId/mark-condition-met', auth, checkOrderAccess, async (req, res) => {
  try {
    const { conditionIndex } = req.body;
    const order = req.order;
    
    // Check if user is the buyer
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only buyers can mark conditions as met.' });
    }

    await order.markConditionMet(conditionIndex);

    res.json({
      message: 'Condition marked as met',
      order
    });
  } catch (error) {
    console.error('Mark condition met error:', error);
    res.status(500).json({ message: 'Server error during condition update.' });
  }
});

// @route   POST /api/orders/:orderId/upload-documents
// @desc    Upload buyer documents
// @access  Private
router.post('/:orderId/upload-documents', auth, checkOrderAccess, upload.array('documents', 10), async (req, res) => {
  try {
    const order = req.order;
    
    // Check if user is the buyer
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only buyers can upload documents.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No documents uploaded.' });
    }

    const uploadedDocuments = [];

    for (const file of req.files) {
      const result = await cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'order-documents',
          public_id: `order_${req.params.orderId}_${Date.now()}_${Math.random()}`
        },
        (error, result) => {
          if (error) {
            throw new Error('Document upload failed');
          }
          uploadedDocuments.push({
            type: req.body.documentType || 'other',
            url: result.secure_url,
            filename: file.originalname,
            uploadedAt: new Date()
          });
        }
      ).end(file.buffer);
    }

    // Add documents to order
    order.buyerDocuments.push(...uploadedDocuments);
    await order.save();

    res.json({
      message: 'Documents uploaded successfully',
      documents: uploadedDocuments
    });
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({ message: 'Server error during document upload.' });
  }
});

// @route   PUT /api/orders/:orderId/update-payment
// @desc    Update payment details
// @access  Private
router.put('/:orderId/update-payment', auth, checkOrderAccess, async (req, res) => {
  try {
    const { paymentDetails } = req.body;
    const order = req.order;
    
    // Check if user is the buyer
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only buyers can update payment details.' });
    }

    await order.updatePaymentDetails(paymentDetails);

    res.json({
      message: 'Payment details updated successfully',
      order
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ message: 'Server error during payment update.' });
  }
});

// @route   PUT /api/orders/:orderId/cancel
// @desc    Cancel order
// @access  Private
router.put('/:orderId/cancel', auth, checkOrderAccess, async (req, res) => {
  try {
    const order = req.order;
    
    // Check if user is the buyer or seller
    if (order.buyerId.toString() !== req.user._id.toString() && 
        order.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to cancel this order.' });
    }

    // Check if order can be cancelled
    if (!['pending', 'reviewing'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled in current status.' });
    }

    await order.updateStatus('cancelled');

    // Update property status back to available
    await Property.findByIdAndUpdate(order.propertyId, { status: 'available' });

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error during order cancellation.' });
  }
});

// @route   GET /api/orders/stats/summary
// @desc    Get order statistics
// @access  Private
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = await Order.getOrderStats(req.user._id, req.user.role);
    
    res.json({ stats });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ message: 'Server error during stats fetch.' });
  }
});

module.exports = router; 