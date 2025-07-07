const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

router.post('/initiate', auth, chatController.initiateChat);
router.post('/send', auth, chatController.sendMessage);
router.post('/send-image', auth, upload.single('image'), chatController.sendImage);
router.get('/history/:chatId', auth, chatController.getChatHistory);
router.get('/history/:propertyId/:userId', auth, chatController.getChatHistoryByProperty);
router.get('/my', auth, chatController.getMyChats);
router.get('/unread-count', auth, chatController.getUnreadCount);

module.exports = router; 