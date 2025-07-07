const Contract = require('../../models/Contract');
const Chat = require('../../models/Chat');
const User = require('../../models/User');

exports.signContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { signatureText, signatureImage, verificationCode, useStoredSignature } = req.body;
    const userId = req.user._id;

    console.log('Looking for contract with ID:', contractId);
    const contract = await Contract.findOne({ contractId });
    console.log('Contract found:', contract ? 'Yes' : 'No');
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    console.log('Contract signatures:', JSON.stringify(contract.signatures, null, 2));

    // Determine if user is landlord, tenant
    const isLandlord = String(contract.landlordId) === String(userId);
    const isTenant = String(contract.tenantId) === String(userId);
    const isWitness = contract.witnessName && contract.witnessName.toLowerCase().includes(req.user.name.toLowerCase());

    if (!isLandlord && !isTenant && !isWitness) {
      return res.status(403).json({ message: 'Not authorized to sign this contract' });
    }

    const userRole = isLandlord ? 'landlord' : isTenant ? 'tenant' : 'witness';

    if (contract.signatures[userRole] && contract.signatures[userRole].signed) {
      return res.status(400).json({ message: 'Contract already signed by this party' });
    }

    if (verificationCode && contract.signatures[userRole] && contract.signatures[userRole].verificationCode) {
      if (!contract.verifySignature(userRole, verificationCode)) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }
    }

    //signature image either from request or stored user signature
    let finalSignatureImage = signatureImage;
    
    if (useStoredSignature && !signatureImage) {
      // stored signature
      const user = await User.findById(userId).select('signature');
      if (user && user.signature) {
        finalSignatureImage = user.signature;
        console.log('Using stored signature for user:', userId);
      } else {
        return res.status(400).json({ 
          message: 'No stored signature found. Please provide a signature or create one first.',
          hasStoredSignature: false
        });
      }
    }

    // validate signature image
    if (!finalSignatureImage || typeof finalSignatureImage !== 'string' || finalSignatureImage.length < 100) {
      console.error('Signature image missing or too short:', finalSignatureImage);
      return res.status(400).json({ 
        message: 'Signature image is required and must be a valid base64 string.',
        hasStoredSignature: false
      });
    }

    // new verification code
    const newVerificationCode = contract.generateVerificationCode();
    if (!contract.signatures) contract.signatures = {};
    if (!contract.signatures[userRole]) contract.signatures[userRole] = {};

    contract.signatures[userRole] = {
      signed: true,
      signedAt: new Date(),
      signatureText: signatureText || `Signed electronically by ${req.user.name}`,
      signatureImage: finalSignatureImage,
      ipAddress: req.ip || req.connection?.remoteAddress || '',
      userAgent: '', // update signature with enhanced details
      verificationCode: newVerificationCode
    };

   
    let newStatus = contract.contractStatus?.current || 'draft';
    if (userRole === 'landlord') {
      newStatus = 'pending_tenant_signature';
    } else if (userRole === 'tenant') {
      if (contract.witnessName && contract.signatures.witness && !contract.signatures.witness.signed) {
        newStatus = 'pending_witness_signature';
      } else {
        newStatus = 'fully_signed';
      }
    } else if (userRole === 'witness') {
      newStatus = 'fully_signed';
    }
    
  
    contract.contractStatus = contract.contractStatus || {};
    contract.contractStatus.current = newStatus;
    contract.contractStatus.history = contract.contractStatus.history || [];
    contract.contractStatus.history.push({
      status: newStatus,   // contract status
      changedBy: userId,
      changedAt: new Date(),
      reason: `${userRole} signed the contract`,
      ipAddress: req.ip || req.connection.remoteAddress
    });

    await contract.save();


    const io = req.app.get('io');
    if (io) {
      io.to(`contract_${contractId}`).emit('contract_updated', {
        contractId, //realtime updates
        status: newStatus,
        signatures: contract.signatures,
        updatedBy: userId
      });
    }

    if (contract.contractStatus.current === 'fully_signed') {
      try {
        await require('../../models/Property').findOneAndUpdate(
          { propertyId: contract.propertyId },
          {
            status: 'rented',
            rentedTo: contract.tenantId,
            rentedAt: new Date()
          }
        );
      } catch (err) {
        console.error('Error updating property status after signing:', err);
      }
    }

    res.json({
      message: 'Contract signed successfully',   //property staus
      contract: {
        contractId: contract.contractId,
        status: newStatus,
        signatures: contract.signatures
      }
    });

  } catch (err) {
    console.error('Error signing contract:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.verifySignature = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { role, verificationCode } = req.body;
    const userId = req.user._id;

    const contract = await Contract.findOne({ contractId });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (String(contract.landlordId) !== String(userId) && 
        String(contract.tenantId) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to verify this signature' });
    }

    const isValid = contract.verifySignature(role, verificationCode);
    
    res.json({
      isValid,
      message: isValid ? 'Signature verification successful' : 'Invalid verification code',
      signature: contract.signatures[role]
    });

  } catch (err) {
    console.error('Error verifying signature:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.sendSignatureReminder = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { recipientRole } = req.body;
    const userId = req.user._id;

    const contract = await Contract.findOne({ contractId });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Check authorization - only landlord or tenant can send reminders
    if (String(contract.landlordId) !== String(userId) && 
        String(contract.tenantId) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to send reminders for this contract' });
    }

    // Determine recipient
    let recipientId, recipientName;
    if (recipientRole === 'landlord') {
      recipientId = contract.landlordId;
      recipientName = contract.landlordDetails.name;
    } else if (recipientRole === 'tenant') {
      recipientId = contract.tenantId;
      recipientName = contract.tenantDetails.name;
    } else {
      return res.status(400).json({ message: 'Invalid recipient role' });
    }

    
    const io = req.app.get('io');
    if (io) {
      io.to(String(recipientId)).emit('signatureReminder', {
        contractId: contract.contractId,
        propertyAddress: contract.propertyAddress,
        senderName: req.user.name,
        message: `${req.user.name} has sent you a reminder to sign contract ${contract.contractId}`
      });
    }

    const chat = await Chat.findOne({
      property: contract.propertyId,
      participants: { $all: [contract.landlordId, contract.tenantId], $size: 2 }
    });

    if (chat) {
      chat.messages.push({
        sender: userId,
        text: `📝 Signature reminder sent to ${recipientName} for contract ${contract.contractId}`,
        timestamp: new Date(),
        type: 'system'
      });
      await chat.save();
    }

    res.json({
      message: 'Signature reminder sent successfully',
      recipient: recipientName
    });

  } catch (err) {
    console.error('Error sending signature reminder:', err);
    res.status(500).json({ message: err.message });
  }
}; 