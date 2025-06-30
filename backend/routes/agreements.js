const express = require('express');
const Agreement = require('../models/Agreement');
const Order = require('../models/Order');
const Property = require('../models/Property');
const { auth, checkOrderAccess } = require('../middleware/auth');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @route   POST /api/agreements/generate
// @desc    Generate agreement document from order
// @access  Private
router.post('/generate', auth, async (req, res) => {
  try {
    const { orderId, agreementType } = req.body;

    // Get order
    const order = await Order.findById(orderId)
      .populate('propertyId')
      .populate('buyerId')
      .populate('sellerId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Check if user is part of the order
    if (order.buyerId._id.toString() !== req.user._id.toString() && 
        order.sellerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this order.' });
    }

    // Check if order is approved
    if (order.status !== 'approved') {
      return res.status(400).json({ message: 'Order must be approved before generating agreement.' });
    }

    // Check if agreement already exists
    const existingAgreement = await Agreement.findOne({ orderId });
    if (existingAgreement) {
      return res.status(400).json({ message: 'Agreement already exists for this order.' });
    }

    // Generate PDF agreement
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    const lineHeight = fontSize * 1.2;
    let yPosition = height - 50;

    // Title
    page.drawText(`${agreementType.toUpperCase()} AGREEMENT`, {
      x: 50,
      y: yPosition,
      size: 18,
      font,
      color: rgb(0, 0, 0)
    });
    yPosition -= lineHeight * 2;

    // Agreement details
    const agreementDetails = [
      `Agreement Number: ${Date.now()}`,
      `Date: ${new Date().toLocaleDateString()}`,
      '',
      'PARTIES:',
      `Buyer: ${order.buyerId.name}`,
      `Email: ${order.buyerId.email}`,
      `Phone: ${order.buyerId.phone}`,
      '',
      `Seller: ${order.sellerId.name}`,
      `Email: ${order.sellerId.email}`,
      `Phone: ${order.sellerId.phone}`,
      '',
      'PROPERTY DETAILS:',
      `Address: ${order.propertyId.location.address}`,
      `City: ${order.propertyId.location.city}`,
      `State: ${order.propertyId.location.state}`,
      `Type: ${order.propertyId.type}`,
      '',
      'TERMS:',
      `Price: $${order.priceAgreed}`,
      `Duration: ${order.duration} months`,
      `Start Date: ${order.startDate ? new Date(order.startDate).toLocaleDateString() : 'TBD'}`,
      `End Date: ${order.endDate ? new Date(order.endDate).toLocaleDateString() : 'TBD'}`,
      '',
      'SIGNATURE SECTIONS:',
      'Buyer Signature: _________________',
      'Date: _________________',
      '',
      'Seller Signature: _________________',
      'Date: _________________'
    ];

    agreementDetails.forEach(line => {
      if (yPosition < 50) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - 50;
      }
      
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: fontSize,
        font,
        color: rgb(0, 0, 0)
      });
      yPosition -= lineHeight;
    });

    const pdfBytes = await pdfDoc.save();

    // Upload PDF to Cloudinary
    const result = await cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'agreements',
        public_id: `agreement_${orderId}_${Date.now()}`,
        format: 'pdf'
      },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: 'PDF upload failed.' });
        }

        // Create agreement record
        const agreement = new Agreement({
          orderId: order._id,
          propertyId: order.propertyId._id,
          buyerId: order.buyerId._id,
          sellerId: order.sellerId._id,
          agreementType,
          terms: {
            rentAmount: order.priceAgreed,
            duration: order.duration,
            startDate: order.startDate,
            endDate: order.endDate,
            paymentSchedule: 'monthly'
          },
          documentUrl: result.secure_url,
          documentPublicId: result.public_id,
          status: 'draft'
        });

        await agreement.save();

        res.json({
          message: 'Agreement generated successfully',
          agreement
        });
      }
    ).end(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Generate agreement error:', error);
    res.status(500).json({ message: 'Server error during agreement generation.' });
  }
});

// @route   GET /api/agreements/my-agreements
// @desc    Get user's agreements
// @access  Private
router.get('/my-agreements', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const agreements = await Agreement.getUserAgreements(req.user._id, req.user.role, status);
    
    // Pagination
    const total = agreements.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedAgreements = agreements.slice(startIndex, endIndex);

    res.json({
      agreements: paginatedAgreements,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });
  } catch (error) {
    console.error('Get agreements error:', error);
    res.status(500).json({ message: 'Server error during agreements fetch.' });
  }
});

// @route   GET /api/agreements/:agreementId
// @desc    Get agreement by ID
// @access  Private
router.get('/:agreementId', auth, async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.agreementId)
      .populate('orderId', 'priceAgreed chatSummary')
      .populate('propertyId', 'title location price')
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email');

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found.' });
    }

    // Check if user is part of the agreement
    if (agreement.buyerId._id.toString() !== req.user._id.toString() && 
        agreement.sellerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this agreement.' });
    }

    res.json(agreement);
  } catch (error) {
    console.error('Get agreement error:', error);
    res.status(500).json({ message: 'Server error during agreement fetch.' });
  }
});

// @route   POST /api/agreements/:agreementId/sign
// @desc    Sign agreement
// @access  Private
router.post('/:agreementId/sign', auth, async (req, res) => {
  try {
    const { signature, ipAddress, userAgent } = req.body;
    const agreement = await Agreement.findById(req.params.agreementId);

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found.' });
    }

    // Check if user is part of the agreement
    if (agreement.buyerId.toString() !== req.user._id.toString() && 
        agreement.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this agreement.' });
    }

    // Check if agreement is not expired
    if (agreement.isExpired()) {
      return res.status(400).json({ message: 'Agreement has expired.' });
    }

    // Add signature based on user role
    if (agreement.buyerId.toString() === req.user._id.toString()) {
      await agreement.addBuyerSignature(signature, ipAddress, userAgent);
    } else {
      await agreement.addSellerSignature(signature, ipAddress, userAgent);
    }

    // If both parties have signed, update order and property status
    if (agreement.isFullySigned()) {
      const order = await Order.findById(agreement.orderId);
      await order.signAgreement(req.user.role);
      
      // Update property status
      await Property.findByIdAndUpdate(agreement.propertyId, { 
        status: agreement.agreementType === 'rental' ? 'rented' : 'sold' 
      });
    }

    res.json({
      message: 'Agreement signed successfully',
      agreement
    });
  } catch (error) {
    console.error('Sign agreement error:', error);
    res.status(500).json({ message: 'Server error during agreement signing.' });
  }
});

// @route   GET /api/agreements/:agreementId/download
// @desc    Download agreement document
// @access  Private
router.get('/:agreementId/download', auth, async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.agreementId);

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found.' });
    }

    // Check if user is part of the agreement
    if (agreement.buyerId.toString() !== req.user._id.toString() && 
        agreement.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this agreement.' });
    }

    // Check if agreement is fully signed
    if (!agreement.isFullySigned()) {
      return res.status(400).json({ message: 'Agreement must be fully signed before download.' });
    }

    res.json({
      downloadUrl: agreement.documentUrl,
      agreementNumber: agreement.agreementNumber
    });
  } catch (error) {
    console.error('Download agreement error:', error);
    res.status(500).json({ message: 'Server error during agreement download.' });
  }
});

// @route   PUT /api/agreements/:agreementId/extend
// @desc    Extend agreement expiry
// @access  Private
router.put('/:agreementId/extend', auth, async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.agreementId);

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found.' });
    }

    // Check if user is part of the agreement
    if (agreement.buyerId.toString() !== req.user._id.toString() && 
        agreement.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this agreement.' });
    }

    // Extend expiry by 7 days
    agreement.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await agreement.save();

    res.json({
      message: 'Agreement expiry extended successfully',
      expiresAt: agreement.expiresAt
    });
  } catch (error) {
    console.error('Extend agreement error:', error);
    res.status(500).json({ message: 'Server error during agreement extension.' });
  }
});

module.exports = router; 