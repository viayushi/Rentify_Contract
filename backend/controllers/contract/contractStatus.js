const Contract = require('../../models/Contract');

exports.getContractStatus = async (req, res) => {
  try {
    const { contractId } = req.params;
    const userId = req.user._id;

    const contract = await Contract.findOne({ contractId })
      .populate('propertyId', 'title location price images')
      .populate('tenantId', 'name email profileImage')
      .populate('landlordId', 'name email profileImage');

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // authoriation
    if (String(contract.landlordId._id) !== String(userId) && 
        String(contract.tenantId._id) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to view this contract' });
    }

    const statusData = {
      contractId: contract.contractId,
      currentStatus: contract.contractStatus.current,
      isFullySigned: contract.isFullySigned(),
      nextSignature: contract.getNextRequiredSignature(),
      signatures: {
        landlord: {
          signed: contract.signatures.landlord.signed,
          signedAt: contract.signatures.landlord.signedAt,
          name: contract.landlordDetails.name
        },
        tenant: {
          signed: contract.signatures.tenant.signed,
          signedAt: contract.signatures.tenant.signedAt,
          name: contract.tenantDetails.name
        },
        witness: contract.witnessName ? {
          signed: contract.signatures.witness.signed,
          signedAt: contract.signatures.witness.signedAt,
          name: contract.witnessName
        } : null
      },
      statusHistory: contract.contractStatus.history,
      summary: contract.getSummary()
    };

    res.json(statusData);

  } catch (err) {
    console.error('Error getting contract status:', err);
    res.status(500).json({ message: err.message });
  }
};

//  pending signatur
exports.getPendingSignatures = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const pendingContracts = await Contract.getPendingSignatures(userId);
    
    const pendingSignatures = pendingContracts.map(contract => ({
      contractId: contract.contractId,
      propertyAddress: contract.propertyAddress,
      landlordName: contract.landlordDetails.name,
      tenantName: contract.tenantDetails.name,
      monthlyRent: contract.monthlyRent,
      startDate: contract.startDate,
      endDate: contract.endDate,
      userRole: String(contract.landlordId._id) === String(userId) ? 'landlord' : 'tenant',
      nextSignature: contract.getNextRequiredSignature(),
      daysRemaining: Math.ceil((new Date(contract.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
    }));

    res.json(pendingSignatures);

  } catch (err) {
    console.error('Error getting pending signatures:', err);
    res.status(500).json({ message: err.message });
  }
};

// contracts by status
exports.getContractsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const userId = req.user._id;

    const contracts = await Contract.getByStatus(status, userId);
    
    const formattedContracts = contracts.map(contract => ({
      ...contract.toObject(),
      isFullySigned: contract.isFullySigned(),
      nextSignature: contract.getNextRequiredSignature(),
      summary: contract.getSummary()
    }));

    res.json(formattedContracts);

  } catch (err) {
    console.error('Error getting contracts by status:', err);
    res.status(500).json({ message: err.message });
  }
}; 