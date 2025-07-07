const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const auth = require('../middleware/auth');

// Contract CRUD operations
router.post('/', auth, contractController.createContract);
router.get('/my', auth, contractController.getMyContracts);
router.delete('/remove/:id', auth, contractController.deleteContract);
router.get('/:contractId', auth, contractController.getContractById);

// Contract approval workflow
router.post('/:contractId/approve', auth, contractController.approveContract);
router.post('/:contractId/reject', auth, contractController.rejectContract);

// E-Signature
router.post('/:contractId/sign', auth, contractController.signContract);

// Contract status and workflow
router.get('/:contractId/status', auth, contractController.getContractStatus);
router.get('/pending-signatures', auth, contractController.getPendingSignatures);
router.post('/:contractId/verify-signature', auth, contractController.verifySignature);
router.post('/:contractId/send-reminder', auth, contractController.sendSignatureReminder);
router.get('/status/:status', auth, contractController.getContractsByStatus);

// Document uploads
router.post('/:contractId/upload-document', auth, contractController.upload.single('document'), contractController.uploadDocument);

// PDF generation and verification
router.post('/:contractId/pdf', auth, contractController.generatePDF);
router.get('/:contractId/pdf', auth, contractController.generatePDF);
router.get('/:contractId/verify', contractController.verifyContract);

// Add contract update route
router.put('/:contractId', auth, contractController.updateContract);

// New route
router.get('/property/:propertyId', auth, contractController.getContractByProperty);

module.exports = router; 