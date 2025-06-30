const express = require('express');
const Property = require('../models/Property');
const { auth, authorize, checkOwnership, checkPropertyAccess } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   POST /api/properties
// @desc    Create a new property listing
// @access  Private (Sellers only)
router.post('/', auth, authorize('seller', 'admin'), async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      purpose,
      price,
      currency,
      location,
      features,
      bedrooms,
      bathrooms,
      area
    } = req.body;

    const property = new Property({
      title,
      description,
      type,
      purpose,
      price,
      currency,
      location: {
        address: location.address,
        city: location.city,
        state: location.state,
        zipCode: location.zipCode,
        country: location.country || 'USA'
      },
      features,
      bedrooms,
      bathrooms,
      area,
      sellerId: req.user._id
    });

    await property.save();

    res.status(201).json({
      message: 'Property created successfully',
      property
    });
  } catch (error) {
    console.error('Property creation error:', error);
    res.status(500).json({ message: 'Server error during property creation.' });
  }
});

// @route   GET /api/properties
// @desc    Get all properties with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      purpose,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      verified,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {};
    if (type) filters.type = type;
    if (purpose) filters.purpose = purpose;
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = Number(minPrice);
      if (maxPrice) filters.price.$lte = Number(maxPrice);
    }
    if (bedrooms) filters.bedrooms = { $gte: Number(bedrooms) };
    if (bathrooms) filters.bathrooms = { $gte: Number(bathrooms) };
    if (verified !== undefined) filters.verified = verified === 'true';

    let query = Property.find({ ...filters, status: 'available', isActive: true });

    // Text search
    if (search) {
      query = query.find({
        $text: { $search: search }
      });
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    query = query.sort(sortOptions);

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    query = query.skip(skip).limit(Number(limit));

    // Populate seller info
    query = query.populate('sellerId', 'name email phone profileVerified');

    const properties = await query.exec();
    const total = await Property.countDocuments({ ...filters, status: 'available', isActive: true });

    res.json({
      properties,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });
  } catch (error) {
    console.error('Property fetch error:', error);
    res.status(500).json({ message: 'Server error during property fetch.' });
  }
});

// @route   GET /api/properties/:id
// @desc    Get property by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('sellerId', 'name email phone profileVerified profileImage');

    if (!property) {
      return res.status(404).json({ message: 'Property not found.' });
    }

    // Increment views
    await property.incrementViews();

    res.json(property);
  } catch (error) {
    console.error('Property fetch error:', error);
    res.status(500).json({ message: 'Server error during property fetch.' });
  }
});

// @route   PUT /api/properties/:id
// @desc    Update property
// @access  Private (Owner only)
router.put('/:id', auth, checkOwnership(Property, 'sellerId'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Handle location update
    if (updateData.location) {
      updateData.location = {
        address: updateData.location.address,
        city: updateData.location.city,
        state: updateData.location.state,
        zipCode: updateData.location.zipCode,
        country: updateData.location.country || 'USA'
      };
    }

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('sellerId', 'name email phone profileVerified');

    res.json({
      message: 'Property updated successfully',
      property
    });
  } catch (error) {
    console.error('Property update error:', error);
    res.status(500).json({ message: 'Server error during property update.' });
  }
});

// @route   DELETE /api/properties/:id
// @desc    Delete property
// @access  Private (Owner only)
router.delete('/:id', auth, checkOwnership(Property, 'sellerId'), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    // Delete images from Cloudinary
    if (property.images.length > 0) {
      for (const image of property.images) {
        if (image.publicId) {
          await cloudinary.uploader.destroy(image.publicId);
        }
      }
    }

    await Property.findByIdAndDelete(req.params.id);

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Property deletion error:', error);
    res.status(500).json({ message: 'Server error during property deletion.' });
  }
});

// @route   POST /api/properties/:id/upload-images
// @desc    Upload property images
// @access  Private (Owner only)
router.post('/:id/upload-images', auth, checkOwnership(Property, 'sellerId'), upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded.' });
    }

    const property = await Property.findById(req.params.id);
    const uploadedImages = [];

    for (const file of req.files) {
      const result = await cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'property-images',
          public_id: `property_${req.params.id}_${Date.now()}_${Math.random()}`,
          transformation: [
            { width: 800, height: 600, crop: 'fill' }
          ]
        },
        (error, result) => {
          if (error) {
            throw new Error('Image upload failed');
          }
          uploadedImages.push({
            url: result.secure_url,
            publicId: result.public_id,
            isPrimary: property.images.length === 0 // First image is primary
          });
        }
      ).end(file.buffer);
    }

    // Add images to property
    property.images.push(...uploadedImages);
    await property.save();

    res.json({
      message: 'Images uploaded successfully',
      images: uploadedImages
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Server error during image upload.' });
  }
});

// @route   POST /api/properties/:id/upload-documents
// @desc    Upload property verification documents
// @access  Private (Owner only)
router.post('/:id/upload-documents', auth, checkOwnership(Property, 'sellerId'), upload.array('documents', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No documents uploaded.' });
    }

    const property = await Property.findById(req.params.id);
    const uploadedDocuments = [];

    for (const file of req.files) {
      const result = await cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'property-documents',
          public_id: `doc_${req.params.id}_${Date.now()}_${Math.random()}`
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

    // Add documents to property
    property.verificationDocuments.push(...uploadedDocuments);
    await property.save();

    res.json({
      message: 'Documents uploaded successfully',
      documents: uploadedDocuments
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ message: 'Server error during document upload.' });
  }
});

// @route   GET /api/properties/seller/my-properties
// @desc    Get current seller's properties
// @access  Private (Sellers only)
router.get('/seller/my-properties', auth, authorize('seller', 'admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filters = { sellerId: req.user._id };
    if (status) filters.status = status;

    const properties = await Property.find(filters)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Property.countDocuments(filters);

    res.json({
      properties,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });
  } catch (error) {
    console.error('My properties fetch error:', error);
    res.status(500).json({ message: 'Server error during properties fetch.' });
  }
});

module.exports = router; 