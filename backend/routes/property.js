const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.post('/add', auth, upload.array('images', 5), propertyController.addProperty);
router.get('/my', auth, propertyController.getMyProperties);
router.get('/', propertyController.getAllProperties);
router.delete('/delete/:id', auth, propertyController.deleteProperty);
router.patch('/status/:id', auth, propertyController.updatePropertyStatus);
router.patch('/update/:id', auth, upload.array('images', 5), propertyController.updateProperty);
router.get('/:id', propertyController.getPropertyById);

// JSON-only endpoints (requires authentication)
router.post('/properties-json', auth, async (req, res) => {
  try {
    const propertiesPath = path.join(__dirname, '../../frontend/src/data/properties.json');
    const data = fs.readFileSync(propertiesPath, 'utf-8');
    const properties = JSON.parse(data);
    const newProperty = req.body;
    
    // Assign a new id if not present
    newProperty.id = newProperty.id || Date.now().toString();
    
    // Always set owner from authenticated user
    newProperty.owner = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      profileImage: req.user.profileImage || ''
    };
    
    properties.push(newProperty);
    fs.writeFileSync(propertiesPath, JSON.stringify(properties, null, 2));
    res.json({ message: 'Property added to properties.json', property: newProperty });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/update/:id', async (req, res) => {
  try {
    const propertiesPath = path.join(__dirname, '../../frontend/src/data/properties.json');
    const data = fs.readFileSync(propertiesPath, 'utf-8');
    const properties = JSON.parse(data);
    const propertyId = req.params.id;
    const updatedProperty = req.body;
    
    const propertyIndex = properties.findIndex(p => String(p.id) === String(propertyId));
    if (propertyIndex === -1) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    properties[propertyIndex] = { ...properties[propertyIndex], ...updatedProperty };
    fs.writeFileSync(propertiesPath, JSON.stringify(properties, null, 2));
    res.json({ message: 'Property updated in properties.json', property: properties[propertyIndex] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    const propertiesPath = path.join(__dirname, '../../frontend/src/data/properties.json');
    const data = fs.readFileSync(propertiesPath, 'utf-8');
    const properties = JSON.parse(data);
    const propertyId = req.params.id;
    
    const propertyIndex = properties.findIndex(p => String(p.id) === String(propertyId));
    if (propertyIndex === -1) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    properties.splice(propertyIndex, 1);
    fs.writeFileSync(propertiesPath, JSON.stringify(properties, null, 2));
    res.json({ message: 'Property deleted from properties.json' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/insert-demo', propertyController.insertDemoData);

module.exports = router; 