const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.get('/profile', auth, userController.getProfile);
router.get('/:id', userController.getUserById);
router.delete('/delete', auth, userController.deleteAccount);

// Settings routes
router.get('/settings', auth, userController.getSettings);
router.patch('/settings', auth, userController.updateSettings);

router.patch('/profile', auth, userController.updateProfile);
router.patch('/password', auth, userController.changePassword);
router.patch('/profile-image', auth, upload.single('profileImage'), userController.updateProfileImage);

// Signature management routes
router.post('/signature', auth, userController.saveSignature);
router.get('/signature', auth, userController.getSignatureStatus);
router.delete('/signature', auth, userController.deleteSignature);

module.exports = router; 