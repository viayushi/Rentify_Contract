const Property = require('../models/Property');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

exports.addProperty = async (req, res) => {
  try {
    let { title, description, price, propertyType, bedrooms, bathrooms, area, address } = req.body;
    const images = req.files ? req.files.map(file => file.path) : [];
    const property = new Property({
      title,
      description,
      price,
      address,
      propertyType,
      bedrooms,
      bathrooms,
      area,
      images,
      owner: req.user._id,
    });
    await property.save();
    await property.populate('owner', 'name email profileImage _id');
    res.status(201).json(property);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user._id }).populate('owner', 'name email profileImage');
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find().populate('owner', 'name email profileImage');
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!property) return res.status(404).json({ message: 'Property not found' });

    // Remove from properties.json
    const propertiesPath = path.join(__dirname, '../../frontend/src/data/properties.json');
    try {
      const data = fs.readFileSync(propertiesPath, 'utf-8');
      let properties = JSON.parse(data);
      // Remove by id (string or number)
      properties = properties.filter(p => String(p.id) !== String(req.params.id) && String(p._id) !== String(req.params.id));
      fs.writeFileSync(propertiesPath, JSON.stringify(properties, null, 2));
    } catch (err) {
      console.error('Failed to update properties.json:', err);
    }

    res.json({ message: 'Property deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePropertyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { status },
      { new: true }
    );
    if (!property) return res.status(404).json({ message: 'Property not found' });
    res.json(property);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPropertyById = async (req, res) => {
  try {
    let property = null;
    const propertyId = req.params.id;
    
    // Try MongoDB first only if it's a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(propertyId)) {
      try {
        property = await Property.findById(propertyId).populate('owner', 'name email profileImage _id');
      } catch (mongoError) {
        console.log('MongoDB lookup failed for ID:', propertyId, mongoError.message);
        // Continue to properties.json fallback
      }
    }
    
    // Always try properties.json as fallback for any ID (including non-ObjectIds)
    if (!property) {
      try {
        const propertiesPath = path.join(__dirname, '../../frontend/src/data/properties.json');
        const data = fs.readFileSync(propertiesPath, 'utf-8');
        const properties = JSON.parse(data);
        
        // Support both numeric and string IDs - convert both to string for comparison
        const fallback = properties.find(p => String(p.id) === String(propertyId));
        
        if (fallback) {
          // Map properties.json structure to match MongoDB response as much as possible
          property = {
            _id: fallback.id,
            title: fallback.title,
            address: fallback.details?.address || fallback.address || fallback.location || '',
            price: fallback.price,
            propertyType: fallback.propertyType || fallback.type,
            bedrooms: fallback.bedrooms,
            bathrooms: fallback.bathrooms,
            area: fallback.area,
            description: fallback.description,
            images: fallback.images ? fallback.images : (fallback.image ? [fallback.image] : []),
            owner: fallback.owner || null,
            details: fallback.details || {},
            rating: fallback.rating,
            reviews: fallback.reviews
          };
        }
      } catch (jsonError) {
        console.log('Properties.json lookup failed for ID:', propertyId, jsonError.message);
      }
    }
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json(property);
  } catch (err) {
    console.error('Error in getPropertyById:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateProperty = async (req, res) => {
  try {
    console.log('PATCH /api/property/update/:id called');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    const { id } = req.params;
    const property = await Property.findOne({ _id: id, owner: req.user._id });
    if (!property) return res.status(404).json({ message: 'Property not found' });

    console.log('Property before update:', property);

    const fields = ['title', 'description', 'price', 'address', 'propertyType', 'bedrooms', 'bathrooms', 'area'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (['price', 'bedrooms', 'bathrooms', 'area'].includes(field)) {
          property[field] = Number(req.body[field]);
        } else {
          property[field] = req.body[field];
        }
      }
    });

    // Handle details object
    if (req.body.details) {
      let details;
      try {
        details = typeof req.body.details === 'string' ? JSON.parse(req.body.details) : req.body.details;
      } catch {
        details = {};
      }
      property.details = {
        ...property.details,
        ...details,
      };
    }

    // Merge existing images and new uploads
    let existingImages = [];
    if (req.body.existingImages) {
      if (Array.isArray(req.body.existingImages)) {
        existingImages = req.body.existingImages;
      } else {
        existingImages = [req.body.existingImages];
      }
    }
    if (req.files && req.files.length > 0) {
      property.images = [...existingImages, ...req.files.map(file => file.path)];
    } else if (existingImages.length > 0) {
      property.images = existingImages;
    }

    await property.save();

    // Fetch the updated property from DB to confirm
    const updatedProperty = await Property.findById(id);
    console.log('Property after update:', updatedProperty);

    res.json(updatedProperty);
  } catch (err) {
    console.error('Error in updateProperty:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.insertDemoData = async (req, res) => {
  try {
    // Demo user
    const demoUserId = 'demo1234567890123456789012';
    let demoUser = await mongoose.model('User').findById(demoUserId);
    if (!demoUser) {
      demoUser = await mongoose.model('User').create({
        _id: demoUserId,
        name: 'Demo Seller',
        email: 'demo@seller.com',
        password: 'Demo@1234', // You may want to hash this or set a random value
        role: 'seller',
        profileImage: 'https://ui-avatars.com/api/?name=Demo+Seller'
      });
    }
    const demoProperties = [
      {
        title: 'Demo Apartment',
        description: 'A beautiful demo apartment for testing.',
        price: 10000,
        address: '123 Demo Street, Demo City',
        propertyType: 'Apartment',
        bedrooms: 2,
        bathrooms: 1,
        area: 900,
        images: ['https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=700&q=80'],
        owner: demoUserId,
        details: {
          address: '123 Demo Street, Demo City',
          furnishing: 'Fully Furnished',
          petPolicy: 'Pets Allowed',
          amenities: ['WiFi', 'Parking', 'Swimming Pool']
        }
      },
      {
        title: 'Demo Villa',
        description: 'A luxurious demo villa for testing.',
        price: 25000,
        address: '456 Demo Avenue, Demo Town',
        propertyType: 'Villa',
        bedrooms: 4,
        bathrooms: 3,
        area: 2500,
        images: ['https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=700&q=80'],
        owner: demoUserId,
        details: {
          address: '456 Demo Avenue, Demo Town',
          furnishing: 'Semi Furnished',
          petPolicy: 'No Pets',
          amenities: ['Gym', 'Power Backup', 'Parking']
        }
      }
    ];
    // Insert demo properties if not already present
    for (const prop of demoProperties) {
      const exists = await Property.findOne({ title: prop.title, owner: demoUserId });
      if (!exists) {
        await Property.create(prop);
      }
    }
    res.json({ message: 'Demo user and properties inserted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};