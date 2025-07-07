const Chat = require('../models/Chat');
const mongoose = require('mongoose');
const User = require('../models/User');
const Property = require('../models/Property');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const isValidObjectId = v => typeof v === 'string' && /^[a-fA-F0-9]{24}$/.test(v);

exports.initiateChat = async (req, res) => {
  console.log('initiateChat called', req.body, req.user && req.user._id);
  try {
    let { propertyId, participantId } = req.body;
    const userId = String(req.user._id);
    propertyId = String(propertyId);
    console.log('initiateChat called with:', { propertyId, participantId, user: userId });
    if (!propertyId || !participantId) {
      return res.status(400).json({ message: 'Missing propertyId or participantId' });
    }
    if (!isValidObjectId(participantId)) {
      return res.status(400).json({ message: 'Invalid participantId' });
    }
    if (participantId === userId) {
      return res.status(400).json({ message: 'Cannot start a chat with yourself.' });
    }
    
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'Participant user not found' });
    }

    if (isValidObjectId(propertyId)) {
      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
    }
    
    let chat = await Chat.findOne({ property: propertyId, participants: { $all: [userId, participantId], $size: 2 } });
    if (!chat) {
      chat = new Chat({ property: propertyId, participants: [userId, participantId], messages: [] });
      await chat.save();
    }
    res.json(chat);
  } catch (err) {
    console.error('Error in initiateChat:', err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { chatId, text } = req.body;
    if (!chatId || !text) return res.status(400).json({ message: 'Missing chatId or text' });
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
  
    if (!chat.participants.map(id => String(id)).includes(String(req.user._id))) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }
    const message = { sender: req.user._id, text };
    chat.messages.push(message);
    await chat.save();
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId).populate('messages.sender', 'name profileImage');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.participants.map(id => String(id)).includes(String(req.user._id))) {
      return res.status(403).json({ message: 'You are not a participant in this chat' }); // allow participants to view chat
    }
    res.json(chat.messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getChatHistoryByProperty = async (req, res) => {
  try {
    const { propertyId, userId } = req.params;
    const currentUserId = String(req.user._id);
    
    // finding chat between current user and the specified user for this property
    const chat = await Chat.findOne({ 
      property: propertyId, 
      participants: { $all: [currentUserId, userId], $size: 2 } 
    }).populate('messages.sender', 'name profileImage');
    
    if (!chat) {
      // Return empty array if no chat exists yet
      return res.json([]);
    }
    
    res.json(chat.messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyChats = async (req, res) => {
  try {
    let chats = await Chat.find({ participants: req.user._id }).populate('participants', 'name email profileImage');
    chats = await Promise.all(chats.map(async chat => {
      if (mongoose.Types.ObjectId.isValid(chat.property)) {
        try {
          await chat.populate('property');
        } catch (err) {
        }
      }
      return chat;
    }));
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = String(req.user._id);
    const chats = await Chat.find({ participants: userId });
    
    let totalUnread = 0;
    for (const chat of chats) {
      const unreadInChat = chat.messages.filter(message => 
        String(message.sender) !== userId && !message.readBy?.includes(userId)
      ).length;
      totalUnread += unreadInChat;
    }
    
    res.json({ count: totalUnread });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendImage = async (req, res) => {
  try {
    const { chatId } = req.body;
    const imageFile = req.file;
    
    if (!chatId || !imageFile) {
      return res.status(400).json({ message: 'Missing chatId or image file' });
    }
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    if (!chat.participants.map(id => String(id)).includes(String(req.user._id))) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }
    
    // image URL 
    const imageUrl = `/uploads/${imageFile.filename}`;
    
    const message = { 
      sender: req.user._id, 
      image: imageUrl,
      text: req.body.text || '',
      timestamp: new Date()
    };
    
    chat.messages.push(message);
    await chat.save();
    // sender info
    const populatedMessage = {
      ...message,
      sender: {
        _id: req.user._id,
        name: req.user.name,
        profileImage: req.user.profileImage
      }
    };
    
    res.json(populatedMessage);
  } catch (err) {
    console.error('Error sending image:', err);
    res.status(500).json({ message: err.message });
  }
}; 