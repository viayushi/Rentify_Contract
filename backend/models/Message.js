const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [{
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'document', 'location'],
      default: 'text'
    },
    attachments: [{
      type: {
        type: String,
        enum: ['image', 'document', 'pdf']
      },
      url: String,
      filename: String,
      size: Number
    }],
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: Date,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  lastMessage: {
    content: String,
    timestamp: Date,
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  archived: {
    buyer: {
      type: Boolean,
      default: false
    },
    seller: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
messageSchema.index({ propertyId: 1, buyerId: 1, sellerId: 1 });
messageSchema.index({ 'lastMessage.timestamp': -1 });

// Method to add a new message
messageSchema.methods.addMessage = function(senderId, content, messageType = 'text', attachments = []) {
  const newMessage = {
    senderId,
    content,
    messageType,
    attachments,
    timestamp: new Date()
  };

  this.messages.push(newMessage);
  this.lastMessage = {
    content,
    timestamp: new Date(),
    senderId
  };

  return this.save();
};

// Method to mark messages as read
messageSchema.methods.markAsRead = function(userId) {
  this.messages.forEach(message => {
    if (message.senderId.toString() !== userId.toString() && !message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
    }
  });
  return this.save();
};

// Method to get unread count for a user
messageSchema.methods.getUnreadCount = function(userId) {
  return this.messages.filter(message => 
    message.senderId.toString() !== userId.toString() && !message.isRead
  ).length;
};

// Static method to find or create conversation
messageSchema.statics.findOrCreateConversation = async function(propertyId, buyerId, sellerId) {
  let conversation = await this.findOne({
    propertyId,
    buyerId,
    sellerId,
    isActive: true
  });

  if (!conversation) {
    conversation = new this({
      propertyId,
      buyerId,
      sellerId,
      messages: []
    });
    await conversation.save();
  }

  return conversation;
};

// Static method to get conversations for a user
messageSchema.statics.getUserConversations = function(userId, role) {
  const query = role === 'buyer' 
    ? { buyerId: userId, isActive: true }
    : { sellerId: userId, isActive: true };

  return this.find(query)
    .populate('propertyId', 'title images location price')
    .populate('buyerId', 'name email profileImage')
    .populate('sellerId', 'name email profileImage')
    .sort({ 'lastMessage.timestamp': -1 });
};

module.exports = mongoose.model('Message', messageSchema); 