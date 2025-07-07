const Contract = require('../../models/Contract');
const Property = require('../../models/Property');
const User = require('../../models/User');
const mongoose = require('mongoose');

// Configure multer for document uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/contracts/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'contract-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

exports.createContract = async (req, res) => {
  try {
    const {
      propertyId,
      tenantId,
      contractId,
      startDate,
      endDate,
      monthlyRent,
      securityDeposit,
      terms,
      conditions,
      propertyAddress,
      tenantDetails,
      landlordDetails,
      placeOfExecution,
      witnessName,
      witnessAddress,
      bedrooms,
      fans,
      lights,
      geysers,
      mirrors,
      taps,
      maintenanceCharges,
      landlordFatherName,
      tenantFatherName,
      tenantOccupation
    } = req.body;

    // Validate required fields (including nested fields)
    const missingFields = [];
    if (!propertyId) missingFields.push('propertyId');
    if (!tenantId) missingFields.push('tenantId');
    if (!contractId) missingFields.push('contractId');
    if (!propertyAddress) missingFields.push('propertyAddress');
    if (!startDate) missingFields.push('startDate');
    if (!endDate) missingFields.push('endDate');
    if (!monthlyRent) missingFields.push('monthlyRent');
    if (!securityDeposit) missingFields.push('securityDeposit');
    if (!terms) missingFields.push('terms');
    if (!placeOfExecution) missingFields.push('placeOfExecution');
    // New required property fields
    if (typeof bedrooms === 'undefined' || bedrooms === null) missingFields.push('bedrooms');
    if (typeof fans === 'undefined' || fans === null) missingFields.push('fans');
    if (typeof lights === 'undefined' || lights === null) missingFields.push('lights');
    if (typeof geysers === 'undefined' || geysers === null) missingFields.push('geysers');
    if (typeof mirrors === 'undefined' || mirrors === null) missingFields.push('mirrors');
    if (typeof taps === 'undefined' || taps === null) missingFields.push('taps');
    if (typeof maintenanceCharges === 'undefined' || maintenanceCharges === null) missingFields.push('maintenanceCharges');
    // New required party fields
    if (!landlordFatherName) missingFields.push('landlordFatherName');
    if (!tenantFatherName) missingFields.push('tenantFatherName');
    if (!tenantOccupation) missingFields.push('tenantOccupation');
    // Landlord details
    if (!landlordDetails || typeof landlordDetails !== 'object') {
      missingFields.push('landlordDetails');
    } else {
      if (!landlordDetails.name) missingFields.push('landlordDetails.name');
      if (!landlordDetails.email) missingFields.push('landlordDetails.email');
      if (!landlordDetails.phone) missingFields.push('landlordDetails.phone');
      if (!landlordDetails.address) missingFields.push('landlordDetails.address');
    }
    // Tenant details
    if (!tenantDetails || typeof tenantDetails !== 'object') {
      missingFields.push('tenantDetails');
    } else {
      if (!tenantDetails.name) missingFields.push('tenantDetails.name');
      if (!tenantDetails.email) missingFields.push('tenantDetails.email');
      if (!tenantDetails.phone) missingFields.push('tenantDetails.phone');
      if (!tenantDetails.address) missingFields.push('tenantDetails.address');
    }
    if (missingFields.length > 0) {
      return res.status(400).json({ message: 'Missing required fields', missingFields });
    }

    // Check if contract ID already exists
    const existingContract = await Contract.findOne({ contractId });
    if (existingContract) {
      return res.status(400).json({ message: 'Contract ID already exists' });
    }

    // Validate tenant exists
    const tenant = await User.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Create contract (no property existence check)
    const contract = new Contract({
      contractId,
      propertyId,
      tenantId,
      landlordId: req.user._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      monthlyRent: parseFloat(monthlyRent),
      securityDeposit: parseFloat(securityDeposit),
      terms,
      conditions,
      propertyAddress,
      tenantDetails,
      landlordDetails,
      placeOfExecution,
      witnessName,
      witnessAddress,
      status: 'pending_approval',
      contractStatus: {
        current: 'pending_landlord_signature',
        history: [{
          status: 'pending_landlord_signature',
          changedAt: new Date(),
          changedBy: req.user._id,
          reason: 'Contract created by landlord',
          ipAddress: req.ip || req.connection.remoteAddress
        }],
        lastUpdated: new Date()
      },
      // Initialize signatures object
      signatures: {
        landlord: { signed: false },
        tenant: { signed: false },
      },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry
      bedrooms,
      fans,
      lights,
      geysers,
      mirrors,
      taps,
      maintenanceCharges,
      landlordFatherName,
      tenantFatherName,
      tenantOccupation
    });

    // Generate digital hash for contract verification
    contract.digitalHash = contract.generateHash();

    await contract.save();

    // Populate references for response
    await contract.populate(['propertyId', 'tenantId', 'landlordId']);

    // Emit contractCreated event to both landlord and tenant
    const io = req.app.get('io');
    if (io) {
      io.to(String(contract.landlordId._id)).emit('contractCreated', {
        contractId: contract.contractId,
        propertyId: contract.propertyId,
        landlordId: contract.landlordId._id,
        tenantId: contract.tenantId._id,
        summary: {
          title: contract.propertyAddress,
          landlord: contract.landlordDetails.name,
          tenant: contract.tenantDetails.name,
          status: contract.status
        }
      });
      io.to(String(contract.tenantId._id)).emit('contractCreated', {
        contractId: contract.contractId,
        propertyId: contract.propertyId,
        landlordId: contract.landlordId._id,
        tenantId: contract.tenantId._id,
        summary: {
          title: contract.propertyAddress,
          landlord: contract.landlordDetails.name,
          tenant: contract.tenantDetails.name,
          status: contract.status
        }
      });
    }

    res.status(201).json({
      message: 'Contract created successfully',
      contract
    });

  } catch (err) {
    console.error('Error creating contract:', err);
    
    // Handle specific validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: 'Contract ID already exists' 
      });
    }
    
    res.status(500).json({ message: err.message });
  }
};

exports.getMyContracts = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get contracts where user is either landlord or tenant
    const contracts = await Contract.find({
      $or: [{ landlordId: userId }, { tenantId: userId }]
    })
    .populate('propertyId', 'title location price images')
    .populate('tenantId', 'name email profileImage')
    .populate('landlordId', 'name email profileImage')
    .sort({ createdAt: -1 });

    res.json(contracts);
  } catch (err) {
    console.error('Error fetching contracts:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getContractById = async (req, res) => {
  try {
    const { contractId } = req.params;
    const userId = req.user._id;

    const contract = await Contract.findOne({ contractId })
      .populate('propertyId', 'title location price images')
      .populate('tenantId', 'name email profileImage phone')
      .populate('landlordId', 'name email profileImage phone');

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Check if user is authorized to view this contract
    if (String(contract.landlordId._id) !== String(userId) && 
        String(contract.tenantId._id) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to view this contract' });
    }

    res.json(contract);
  } catch (err) {
    console.error('Error fetching contract:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteContract = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const contract = await Contract.findOne({ contractId: id });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (String(contract.landlordId) !== String(userId) && String(contract.tenantId) !== String(userId)) {
      return res.status(403).json({ message: 'You are not authorized to delete this contract' });
    }

    const result = await Contract.deleteOne({ contractId: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Contract not found or already deleted' });
    }

    
    const io = req.app.get('io');
    if (io) {
      io.to(String(contract.landlordId)).emit('contractDeleted', {
        contractId: contract.contractId,
        deletedBy: userId
      });
      io.to(String(contract.tenantId)).emit('contractDeleted', {
        contractId: contract.contractId,
        deletedBy: userId
      });
    }

    res.json({ message: 'Contract deleted successfully' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { documentType, userRole } = req.body;
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const contract = await Contract.findOne({ contractId });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    const isLandlord = String(contract.landlordId) === String(userId);
    const isTenant = String(contract.tenantId) === String(userId);

    if ((userRole === 'landlord' && !isLandlord) || (userRole === 'tenant' && !isTenant)) {
      return res.status(403).json({ message: 'Not authorized to upload documents for this role' });
    }

    const fileUrl = `/uploads/contracts/${req.file.filename}`;
    const documentField = `documents.${userRole}.${documentType}`;

    contract[documentField] = fileUrl;
    await contract.save();

    res.json({
      message: 'Document uploaded successfully',
      documentUrl: fileUrl
    });

  } catch (err) {
    console.error('Error uploading document:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const updates = req.body;
    const userId = req.user._id;

    const contract = await Contract.findOne({ contractId });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (String(contract.landlordId) !== String(userId) && String(contract.tenantId) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to edit this contract' });
    }

  
    let landlordChanged = false, tenantChanged = false, witnessChanged = false;

   
    if (updates.landlordDetails) {
      for (const key of Object.keys(updates.landlordDetails)) {
        if (contract.landlordDetails[key] !== updates.landlordDetails[key]) landlordChanged = true;
        contract.landlordDetails[key] = updates.landlordDetails[key];
      }
    }
   
    if (updates.tenantDetails) {
      for (const key of Object.keys(updates.tenantDetails)) {
        if (contract.tenantDetails[key] !== updates.tenantDetails[key]) tenantChanged = true;
        contract.tenantDetails[key] = updates.tenantDetails[key];
      }
    }
    // Update witness details
    if (typeof updates.witnessName === 'string' && contract.witnessName !== updates.witnessName) {
      witnessChanged = true;
      contract.witnessName = updates.witnessName;
    }
    if (typeof updates.witnessAddress === 'string') {
      contract.witnessAddress = updates.witnessAddress;
    }
    const updatableFields = ['propertyAddress', 'monthlyRent', 'securityDeposit', 'startDate', 'endDate', 'terms', 'conditions', 'placeOfExecution'];
    updatableFields.forEach(field => {
      if (typeof updates[field] !== 'undefined') contract[field] = updates[field];
    });

    if (landlordChanged) contract.signatures.landlord = { signed: false };
    if (tenantChanged) contract.signatures.tenant = { signed: false };

    const missingFields = [];
    if (!contract.propertyAddress) missingFields.push('propertyAddress');
    if (!contract.monthlyRent) missingFields.push('monthlyRent');
    if (!contract.securityDeposit) missingFields.push('securityDeposit');
    if (!contract.startDate) missingFields.push('startDate');
    if (!contract.endDate) missingFields.push('endDate');
    if (!contract.terms) missingFields.push('terms');
    if (!contract.placeOfExecution) missingFields.push('placeOfExecution');

    if (typeof contract.bedrooms === 'undefined' || contract.bedrooms === null) missingFields.push('bedrooms');
    if (typeof contract.fans === 'undefined' || contract.fans === null) missingFields.push('fans');
    if (typeof contract.lights === 'undefined' || contract.lights === null) missingFields.push('lights');
    if (typeof contract.geysers === 'undefined' || contract.geysers === null) missingFields.push('geysers');
    if (typeof contract.mirrors === 'undefined' || contract.mirrors === null) missingFields.push('mirrors');
    if (typeof contract.taps === 'undefined' || contract.taps === null) missingFields.push('taps');
    if (typeof contract.maintenanceCharges === 'undefined' || contract.maintenanceCharges === null) missingFields.push('maintenanceCharges');

    if (!contract.landlordFatherName) missingFields.push('landlordFatherName');
    if (!contract.tenantFatherName) missingFields.push('tenantFatherName');
    if (!contract.tenantOccupation) missingFields.push('tenantOccupation');
    if (!contract.landlordDetails || typeof contract.landlordDetails !== 'object') {
      missingFields.push('landlordDetails');
    } else {
      if (!contract.landlordDetails.name) missingFields.push('landlordDetails.name');
      if (!contract.landlordDetails.email) missingFields.push('landlordDetails.email');
      if (!contract.landlordDetails.phone) missingFields.push('landlordDetails.phone');
      if (!contract.landlordDetails.address) missingFields.push('landlordDetails.address');
    }
    if (!contract.tenantDetails || typeof contract.tenantDetails !== 'object') {
      missingFields.push('tenantDetails');
    } else {
      if (!contract.tenantDetails.name) missingFields.push('tenantDetails.name');
      if (!contract.tenantDetails.email) missingFields.push('tenantDetails.email');
      if (!contract.tenantDetails.phone) missingFields.push('tenantDetails.phone');
      if (!contract.tenantDetails.address) missingFields.push('tenantDetails.address');
    }
    if (missingFields.length > 0) {
      return res.status(400).json({ message: 'All required fields must be filled.', missingFields });
    }

    await contract.save();
    res.json({ message: 'Contract updated successfully', contract });
  } catch (err) {
    console.error('Error updating contract:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.upload = upload; 