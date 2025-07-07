const Contract = require('../../models/Contract');
const Property = require('../../models/Property');
const Chat = require('../../models/Chat');

exports.approveContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { feedback } = req.body;
    const userId = req.user._id;

    const contract = await Contract.findOne({ contractId });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // user is landlord or tenant
    const isLandlord = String(contract.landlordId) === String(userId);
    const isTenant = String(contract.tenantId) === String(userId);

    if (!isLandlord && !isTenant) {
      return res.status(403).json({ message: 'Not authorized to approve this contract' });
    }

    const userRole = isLandlord ? 'landlord' : 'tenant';
    const approvalField = `approvals.${userRole}`;

    // approvals object and subfields exist
    if (!contract.approvals) contract.approvals = {};
    if (!contract.approvals.landlord) contract.approvals.landlord = {};
    if (!contract.approvals.tenant) contract.approvals.tenant = {};

    // Update approval status
    contract.approvals[userRole] = {
      approved: true,
      approvedAt: new Date(),
      feedback: feedback || '',
      ipAddress: req.ip
    };

    // Log the approving user's name
    if (req.user && req.user.name) {
      console.log(`Contract ${contractId} approved by ${req.user.name} (${userRole})`);
    } else {
      console.log(`Contract ${contractId} approved by userId ${userId} (${userRole})`);
    }

    // Update contract status
    if (isLandlord) {
      const newStatus = contract.approvals.tenant.approved ? 'approved' : 'landlord_approved';
      contract.contractStatus = contract.contractStatus || {};
      contract.contractStatus.current = newStatus;
      contract.contractStatus.history = contract.contractStatus.history || [];
      contract.contractStatus.history.push({
        status: newStatus,
        changedAt: new Date(),
        changedBy: userId,
        reason: `Landlord approved contract`,
        ipAddress: req.ip || req.connection.remoteAddress
      });
      contract.contractStatus.lastUpdated = new Date();
    } else {
      const newStatus = contract.approvals.landlord.approved ? 'approved' : 'tenant_approved';
      contract.contractStatus = contract.contractStatus || {};
      contract.contractStatus.current = newStatus;
      contract.contractStatus.history = contract.contractStatus.history || [];
      contract.contractStatus.history.push({
        status: newStatus,
        changedAt: new Date(),
        changedBy: userId,
        reason: `Tenant approved contract`,
        ipAddress: req.ip || req.connection.remoteAddress
      });
      contract.contractStatus.lastUpdated = new Date();
    }

    // If both parties approved, update property status
    if (contract.contractStatus.current === 'approved' || (contract.approvals.landlord.approved && contract.approvals.tenant.approved)) {
      contract.approvedAt = new Date();
      // Update property status to rented
      await Property.findOneAndUpdate(
        { propertyId: contract.propertyId },
        {
          status: 'rented',
          rentedTo: contract.tenantId,
          rentedAt: new Date()
        }
      );
 
      const chat = await Chat.findOne({
        property: contract.propertyId,
        participants: { $all: [contract.landlordId, contract.tenantId], $size: 2 }
      });
      if (chat) {
        chat.messages.push({
          sender: contract.landlordId,
          text: 'Contract approved',
          timestamp: new Date()
        });
        await chat.save();
        // Emit socket events
        const io = req.app.get('io');
        if (io) {
          io.to(String(contract.landlordId)).emit('chat_message', { chatId: chat._id, text: 'Contract approved' });
          io.to(String(contract.tenantId)).emit('chat_message', { chatId: chat._id, text: 'Contract approved' });
        }
      }
    }

    await contract.save();
    console.log('Contract after save:', JSON.stringify(contract, null, 2));

    // Emit real-time updates
    const io = req.app.get('io');
    if (io) {
      const contractSummary = contract.getSummary();
      

      io.to(String(contract.landlordId)).emit('contractUpdate', {
        contractId: contract.contractId,
        action: 'approved',
        by: userRole,
        byName: req.user && req.user.name ? req.user.name : userId,
        status: contract.contractStatus.current,
        summary: contractSummary,
        contract: contract
      });
      
      io.to(String(contract.tenantId)).emit('contractUpdate', {
        contractId: contract.contractId,
        action: 'approved',
        by: userRole,
        byName: req.user && req.user.name ? req.user.name : userId,
        status: contract.contractStatus.current,
        summary: contractSummary,
        contract: contract
      });

      io.to(String(contract.landlordId)).emit('contractApproved', {
        contractId: contract.contractId,
        approvedBy: userRole,
        status: contract.contractStatus.current
      });
      
      io.to(String(contract.tenantId)).emit('contractApproved', {
        contractId: contract.contractId,
        approvedBy: userRole,
        status: contract.contractStatus.current
      });
    }

    res.json({
      message: 'Contract approved successfully',
      contract
    });

  } catch (err) {
    console.error('Error approving contract:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.rejectContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { feedback } = req.body;
    const userId = req.user._id;

    const contract = await Contract.findOne({ contractId });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Determine if user is landlord or tenant
    const isLandlord = String(contract.landlordId) === String(userId);
    const isTenant = String(contract.tenantId) === String(userId);

    if (!isLandlord && !isTenant) {
      return res.status(403).json({ message: 'Not authorized to reject this contract' });
    }

    const userRole = isLandlord ? 'landlord' : 'tenant';
    const approvalField = `approvals.${userRole}`;

    // Update rejection status
    contract.approvals[userRole] = {
      approved: false,
      approvedAt: new Date(),
      feedback: feedback || 'Contract rejected',
      ipAddress: req.ip
    };

    contract.contractStatus = contract.contractStatus || {};
    contract.contractStatus.current = 'rejected';
    contract.contractStatus.history = contract.contractStatus.history || [];
    contract.contractStatus.history.push({
      status: 'rejected',
      changedAt: new Date(),
      changedBy: userId,
      reason: `${userRole} rejected contract`,
      ipAddress: req.ip || req.connection.remoteAddress
    });
    contract.contractStatus.lastUpdated = new Date();
    await contract.save();

    // Emit real-time updates
    const io = req.app.get('io');
    if (io) {
      const contractSummary = contract.getSummary();
      
      // Emit to both parties
      io.to(String(contract.landlordId)).emit('contractUpdated', {
        contractId: contract.contractId,
        action: 'rejected',
        by: userRole,
        status: contract.contractStatus.current,
        summary: contractSummary
      });
      
      io.to(String(contract.tenantId)).emit('contractUpdated', {
        contractId: contract.contractId,
        action: 'rejected',
        by: userRole,
        status: contract.contractStatus.current,
        summary: contractSummary
      });

      // Emit specific rejection event
      io.to(String(contract.landlordId)).emit('contractRejected', {
        contractId: contract.contractId,
        rejectedBy: userRole,
        status: contract.contractStatus.current
      });
      
      io.to(String(contract.tenantId)).emit('contractRejected', {
        contractId: contract.contractId,
        rejectedBy: userRole,
        status: contract.contractStatus.current
      });
    }

    res.json({
      message: 'Contract rejected successfully',
      contract
    });

  } catch (err) {
    console.error('Error rejecting contract:', err);
    res.status(500).json({ message: err.message });
  }
}; 