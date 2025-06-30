const express = require('express');
const Message = require('../models/Message');
const Property = require('../models/Property');
const { auth, checkPropertyAccess } = require('../middleware/auth');
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

// @route   POST /api/messages/start-conversation
// @desc    Start a new conversation for a property
// @access  Private
router.post('/start-conversation', auth, checkPropertyAccess, async (req, res) => {
  try {
    const { propertyId, initialMessage } = req.body;
    const property = req.property;

    // Check if user is not the seller
    if (property.sellerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Sellers cannot start conversations for their own properties.' });
    }

    // Find or create conversation
    const conversation = await Message.findOrCreateConversation(
      propertyId,
      req.user._id,
      property.sellerId
    );

    // Add initial message if provided
    if (initialMessage) {
      await conversation.addMessage(req.user._id, initialMessage);
    }

    // Populate conversation data
    await conversation.populate([
      { path: 'propertyId', select: 'title images location price sellerId' },
      { path: 'buyerId', select: 'name email profileImage' },
      { path: 'sellerId', select: 'name email profileImage' }
    ]);

    res.status(201).json({
      message: 'Conversation started successfully',
      conversation
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ message: 'Server error during conversation creation.' });
  }
});

// @route   GET /api/messages/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Message.getUserConversations(req.user._id, req.user.role);
    
    res.json({
      conversations,
      unreadCounts: conversations.map(conv => ({
        conversationId: conv._id,
        unreadCount: conv.getUnreadCount(req.user._id)
      }))
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error during conversations fetch.' });
  }
});

// @route   GET /api/messages/conversation/:conversationId
// @desc    Get conversation messages
// @access  Private
router.get('/conversation/:conversationId', auth, async (req, res) => {
  try {
    const conversation = await Message.findById(req.params.conversationId)
      .populate('propertyId', 'title images location price sellerId')
      .populate('buyerId', 'name email profileImage')
      .populate('sellerId', 'name email profileImage')
      .populate('messages.senderId', 'name email profileImage');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    // Check if user is part of this conversation
    if (conversation.buyerId._id.toString() !== req.user._id.toString() && 
        conversation.sellerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this conversation.' });
    }

    // Mark messages as read
    await conversation.markAsRead(req.user._id);

    res.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error during conversation fetch.' });
  }
});

// @route   POST /api/messages/conversation/:conversationId/send
// @desc    Send a message in a conversation
// @access  Private
router.post('/conversation/:conversationId/send', auth, async (req, res) => {
  try {
    const { content, messageType = 'text' } = req.body;
    
    const conversation = await Message.findById(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    // Check if user is part of this conversation
    if (conversation.buyerId.toString() !== req.user._id.toString() && 
        conversation.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this conversation.' });
    }

    // Add message
    await conversation.addMessage(req.user._id, content, messageType);

    // Populate the new message
    await conversation.populate('messages.senderId', 'name email profileImage');

    const newMessage = conversation.messages[conversation.messages.length - 1];

    res.json({
      message: 'Message sent successfully',
      newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error during message sending.' });
  }
});

// @route   POST /api/messages/conversation/:conversationId/upload-attachment
// @desc    Upload attachment in a conversation
// @access  Private
router.post('/conversation/:conversationId/upload-attachment', auth, upload.single('attachment'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const conversation = await Message.findById(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    // Check if user is part of this conversation
    if (conversation.buyerId.toString() !== req.user._id.toString() && 
        conversation.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this conversation.' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'message-attachments',
        public_id: `msg_${req.params.conversationId}_${Date.now()}_${Math.random()}`
      },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: 'File upload failed.' });
        }

        const attachment = {
          type: req.file.mimetype.startsWith('image/') ? 'image' : 'document',
          url: result.secure_url,
          filename: req.file.originalname,
          size: req.file.size
        };

        // Add message with attachment
        await conversation.addMessage(
          req.user._id, 
          `Sent ${req.file.mimetype.startsWith('image/') ? 'an image' : 'a document'}: ${req.file.originalname}`,
          req.file.mimetype.startsWith('image/') ? 'image' : 'document',
          [attachment]
        );

        res.json({
          message: 'Attachment uploaded successfully',
          attachment
        });
      }
    ).end(req.file.buffer);
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ message: 'Server error during attachment upload.' });
  }
});

// @route   PUT /api/messages/conversation/:conversationId/mark-read
// @desc    Mark conversation messages as read
// @access  Private
router.put('/conversation/:conversationId/mark-read', auth, async (req, res) => {
  try {
    const conversation = await Message.findById(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    // Check if user is part of this conversation
    if (conversation.buyerId.toString() !== req.user._id.toString() && 
        conversation.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this conversation.' });
    }

    await conversation.markAsRead(req.user._id);

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error during mark read operation.' });
  }
});

// @route   PUT /api/messages/conversation/:conversationId/archive
// @desc    Archive a conversation
// @access  Private
router.put('/conversation/:conversationId/archive', auth, async (req, res) => {
  try {
    const conversation = await Message.findById(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    // Check if user is part of this conversation
    if (conversation.buyerId.toString() !== req.user._id.toString() && 
        conversation.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this conversation.' });
    }

    // Archive for the current user
    if (req.user.role === 'buyer') {
      conversation.archived.buyer = true;
    } else {
      conversation.archived.seller = true;
    }

    await conversation.save();

    res.json({ message: 'Conversation archived successfully' });
  } catch (error) {
    console.error('Archive conversation error:', error);
    res.status(500).json({ message: 'Server error during conversation archival.' });
  }
});

// @route   GET /api/messages/unread-count
// @desc    Get total unread messages count
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const conversations = await Message.getUserConversations(req.user._id, req.user.role);
    
    const totalUnread = conversations.reduce((total, conv) => {
      return total + conv.getUnreadCount(req.user._id);
    }, 0);

    res.json({ unreadCount: totalUnread });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error during unread count fetch.' });
  }
});

module.exports = router; 