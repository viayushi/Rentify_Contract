const contractController = require('./contract');
const Contract = require('../models/Contract');

const getContractByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user._id;
    const contract = await Contract.findOne({
      propertyId,
      $or: [
        { landlordId: userId },
        { tenantId: userId }
      ]
    })
    .populate('propertyId')
    .populate('landlordId')
    .populate('tenantId');
    if (!contract) {
      return res.status(404).json({ message: 'No contract found for this property.' });
    }
    res.json(contract);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  ...contractController,
  getContractByProperty,
}; 