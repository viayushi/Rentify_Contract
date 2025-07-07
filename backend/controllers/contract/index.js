const contractCore = require('./contractCore');
const contractApproval = require('./contractApproval');
const contractSignature = require('./contractSignature');
const contractStatus = require('./contractStatus');
const contractPDF = require('./contractPDF');
const contractVerification = require('./contractVerification');


module.exports = {

  createContract: contractCore.createContract,
  getMyContracts: contractCore.getMyContracts,
  getContractById: contractCore.getContractById,
  deleteContract: contractCore.deleteContract,
  uploadDocument: contractCore.uploadDocument,
  upload: contractCore.upload,
  updateContract: contractCore.updateContract,

  approveContract: contractApproval.approveContract,
  rejectContract: contractApproval.rejectContract,


  signContract: contractSignature.signContract,
  verifySignature: contractSignature.verifySignature,
  sendSignatureReminder: contractSignature.sendSignatureReminder,

  getContractStatus: contractStatus.getContractStatus,
  getPendingSignatures: contractStatus.getPendingSignatures,
  getContractsByStatus: contractStatus.getContractsByStatus,

  generatePDF: contractPDF.generatePDF,

  verifyContract: contractVerification.verifyContract
}; 