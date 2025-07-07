const Contract = require('../../models/Contract');

exports.verifyContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { digitalHash } = req.query;

    const contract = await Contract.findOne({ contractId });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    const isValid = contract.digitalHash === digitalHash;
    const verificationData = {
      contractId: contract.contractId,
      isValid,
      digitalHash: contract.digitalHash,
      createdAt: contract.createdAt,
      status: contract.status,
      propertyAddress: contract.propertyAddress,
      landlordName: contract.landlordDetails.name,
      tenantName: contract.tenantDetails.name
    };

    res.json({
      message: isValid ? 'Contract verification successful' : 'Contract verification failed',
      verification: verificationData
    });

  } catch (err) {
    console.error('Error verifying contract:', err);
    res.status(500).json({ message: err.message });
  }
}; 