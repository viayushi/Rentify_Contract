const Contract = require('../../models/Contract');
const path = require('path');
const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const QRCode = require('qrcode');

exports.generatePDF = async (req, res) => {
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

    if (String(contract.landlordId._id) !== String(userId) && 
        String(contract.tenantId._id) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to generate PDF for this contract' });
    }


    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Rental_Contract_${contractId}.pdf`);

    const chakraPath = path.join(__dirname, '../../assets/state-emblem.png');
    const appName = 'Real Estate Rental Platform';
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN');
    const place = contract.placeOfExecution || '__________';
    const placeUpper = place ? place.toUpperCase() : '__________';

    const verificationUrl = `http://localhost:5000/api/contract/${contractId}/verify?digitalHash=${contract.digitalHash}`;
    const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `Rental Agreement - ${contract.contractId}`,
        Author: appName,
        Subject: 'Legal Rental Agreement',
        Keywords: 'rental, agreement, contract, property',
        Creator: appName,
        Producer: 'PDFKit'
      }
    });

    doc.pipe(res);

    doc.on('error', (err) => {
      console.error('PDF generation error:', err);
      try { doc.end(); } catch (e) {}
    });

    const headerHeight = 120;
    doc.rect(0, 0, doc.page.width, headerHeight).fill('#e6f4ea');
    try {
      const emblemWidth = 100;
      const emblemHeight = 100;
      const emblemY = 10;
      
      doc.image(chakraPath, 40, emblemY, { width: emblemWidth, height: emblemHeight });
      doc.image(chakraPath, doc.page.width - 40 - emblemWidth, emblemY, { width: emblemWidth, height: emblemHeight });
    
      doc.fontSize(32).fillColor('#14532d').font('Helvetica-Bold').text('GOVERNMENT OF INDIA', 50, emblemY + 30, { align: 'center' });
    } catch (e) { 
      console.error('Ashoka Chakra image error:', e);
    
      doc.fontSize(32).fillColor('#14532d').font('Helvetica-Bold').text('GOVERNMENT OF INDIA', 0, 50, { align: 'center' });
    }

    let y = headerHeight + 10;
    doc.fontSize(18).fillColor('#14532d').font('Helvetica-Bold').text('LEGAL RENTAL AGREEMENT', 0, y, { align: 'center' });
    y += 32;

    const leftX = 50, rightX = doc.page.width / 2 + 10;
    doc.fontSize(13).fillColor('#14532d').font('Helvetica-Bold').text('LANDLORD DETAILS', leftX, y);
    doc.fontSize(13).fillColor('#14532d').font('Helvetica-Bold').text('TENANT DETAILS', rightX, y);
    y += 20;
    doc.fontSize(11).fillColor('#222').font('Helvetica');
    const landlordName = contract.landlordDetails.name ? contract.landlordDetails.name.toUpperCase() : '';
    const landlordFather = contract.landlordFatherName ? contract.landlordFatherName.toUpperCase() : '';
    const landlordAddress = contract.landlordDetails.address ? contract.landlordDetails.address.toUpperCase() : '';
    const tenantName = contract.tenantDetails.name ? contract.tenantDetails.name.toUpperCase() : '';
    const tenantFather = contract.tenantFatherName ? contract.tenantFatherName.toUpperCase() : '';
    const tenantWork = contract.tenantOccupation ? contract.tenantOccupation.toUpperCase() : '';
    const tenantAddress = contract.tenantDetails.address ? contract.tenantDetails.address.toUpperCase() : '';

    let y1 = y, y2 = y;
    doc.text(`NAME: ${landlordName}`, leftX, y1); y1 = doc.y;
    doc.text(`NAME: ${tenantName}`, rightX, y2); y2 = doc.y;
    let yNext = Math.max(y1, y2);
    doc.text(`FATHER'S NAME: ${landlordFather}`, leftX, yNext); y1 = doc.y;
    doc.text(`FATHER'S NAME: ${tenantFather}`, rightX, yNext); y2 = doc.y;
    yNext = Math.max(y1, y2);
    doc.text(`ADDRESS: ${landlordAddress}`, leftX, yNext); y1 = doc.y;
    doc.text(`WORKPLACE: ${tenantWork}`, rightX, yNext); y2 = doc.y;
    yNext = Math.max(y1, y2);
    doc.text('', leftX, yNext); 
    doc.text(`ADDRESS: ${tenantAddress}`, rightX, yNext); y2 = doc.y;
    y = Math.max(y1, y2) + 15;

    const propertyAddress = contract.propertyAddress ? contract.propertyAddress.toUpperCase() : '';
    const startDate = new Date(contract.startDate).toLocaleDateString();
    const endDate = new Date(contract.endDate).toLocaleDateString();
    const rentAmount = contract.monthlyRent ? `Rs.${contract.monthlyRent.toLocaleString()}` : '';
    const securityDeposit = contract.securityDeposit ? `Rs.${contract.securityDeposit.toLocaleString()}` : '';
    const maintenanceCharges = contract.maintenanceCharges ? `Rs.${contract.maintenanceCharges.toLocaleString()}` : '';
    const bedrooms = contract.bedrooms !== undefined ? contract.bedrooms : '';
    const fans = contract.fans !== undefined ? contract.fans : '';
    const lights = contract.lights !== undefined ? contract.lights : '';
    const geysers = contract.geysers !== undefined ? contract.geysers : '';
    const mirrors = contract.mirrors !== undefined ? contract.mirrors : '';
    const taps = contract.taps !== undefined ? contract.taps : '';
    const month = today.toLocaleString('default', { month: 'long' }).toUpperCase();
    const year = today.getFullYear();
    const day = today.getDate();
    const city = placeUpper;
    const witnessName = contract.witnessName ? contract.witnessName.toUpperCase() : '';
    const witnessAddress = contract.witnessAddress ? contract.witnessAddress.toUpperCase() : '';
    const legalText = `This RENTAL AGREEMENT is executed at ${placeUpper} on this ${day} day of ${month}, ${year} by and between:\n\n${landlordName},\nS/o or D/o. ${landlordFather},\n${landlordAddress}\n(hereinafter jointly and severally called the "OWNER", which expression shall include their heirs, legal representatives, successors and assigns) of the ONE PART:\n\nAND, in favour of:\n${tenantName},\nS/o or D/o. ${tenantFather},\nWorking/Studying at ${tenantWork}\nhaving a permanent address at ${tenantAddress}\n(hereinafter called the "TENANT", which expression shall include its legal representatives, successors and assigns) of the OTHER PART.\n\nWHEREAS the Owner is the absolute owner of the property situated at ${propertyAddress} as detailed in Annexure-I, hereinafter referred to as "Demised Premises".\nWHEREAS the Tenant has requested the Owner to grant Rent with respect to the Schedule Premises and the Owner has agreed to rent out to the Tenant the Property with two-wheeler and four-wheeler parking space in the ground floor for residential purposes only, on the following terms and conditions:\n\nNOW THIS DEED WITNESSETH AS FOLLOWS:\n1. That the Tenant shall pay to the Owner a monthly rent of ${rentAmount}, excluding electricity and water bill. The rent shall be paid on or before 7th day of each month without fail.\n2. That the Tenant shall pay to the Owner a monthly maintenance charge of ${maintenanceCharges} towards the maintenance of Generator & Elevator, Salaries towards guards, Charges for Electricity Maintenance for Common Areas, Charges towards cleaning of Common Areas and towards maintaining the lawn.\n3. That the Tenant shall pay for the running cost of elevator and generator separately to the Owner.\n4. That during the Rent period, in addition to the rental amount payable to the Owner, the Tenant shall pay for the use of electricity and water as per bills received from the authorities concerned directly. For all the dues of electricity bills and water bills till the date the possession of the premises is handed over by the Owner to the Tenant it is the responsibility of the Owner to pay and clear them according to the readings on the respective meters. At the time of handing over possession of the premises back to the Owner by Tenant, it is the responsibility of the Tenant to pay electricity & water bills, as presented by the Departments concerned according to the readings on the respective meters upto the date of vacation of the property.\n5. The said amount of the Security deposit ${securityDeposit} shall be refunded by the Owner to the Tenant at the time of handing over possession of the demised premises by the Tenant upon expiry or sooner termination of this Rent after adjusting any dues (if any) or cost towards damages caused by the negligence of the Tenant or the person he is responsible for, normal wear & tear and damages due to act of god exempted. In case the Owner fails to refund the security deposit to the Tenant on early termination or expiry of the Rent agreement, the Tenant is entitled to hold possession of the Rented premises, without payment of rent and/or any other charges whatsoever, till such time the Owner refunds the security deposit to the Tenant. This is without prejudice and in addition to the other remedies available to the Tenant to recover the amount from the Owner.\n6. That all the sanitary, electrical and other fittings and fixtures and appliances in the premises shall be handed over from the Owner to the Tenant in good working condition.\n7. That the Tenant shall not sublet, assign or part with the demised premises in whole or part thereof to any person in any circumstances whatsoever and the same shall be used for the bonafide residential purposes only.\n8. That the day-to-day minor repairs will be the responsibility for the Tenant at his/her own expense. However, any structural or major repairs, if so required, shall be carried out by the Owner.\n9. That no structural additions or alterations shall be made by the Tenant in the premises without the prior written consent of the Owner but the Tenant can install air-conditioners in the space provided and other electrical gadgets and make such changes for the purposes as may be necessary, at his own cost. On termination of the tenancy or earlier, the Tenant will be entitled to remove such equipment and restore the changes made, if any, to the original state.\n10. That the Owner shall hold the right to visit in person or through his authorized agent(s), servants, workmen etc., to enter upon the demised premises for inspection (not exceeding once in a month) or to carry out repairs / construction, as and when required.\n11. That the Tenant shall comply with all the rules and regulations of the local authority applicable to the demised premises. The premises will be used only for residential purposes of its employees, families and guests.\n12. That the Owner shall pay for all taxes/cesses levied on the premises by the local or government authorities in the way of property tax for the premises and so on. Further, any other payment in the nature of subscription or periodical fee to the welfare association shall be paid by the Owner.\n13. That the Owner will keep the Tenant free and harmless from any claims, proceedings, demands, or actions by others with respect to quiet possession of the premises.\n14. That this Rent Agreement can be terminated before the expiry of this tenancy period by serving One month prior notice in writing by either party.\n15. The Tenant shall maintain the Demised Premises in good and tenable condition and all the minor repairs such as leakage in the sanitary fittings, water taps and electrical usage etc. shall be carried out by the Tenant. That it shall be the responsibility of the Tenant to hand over the vacant and peaceful possession of the demised premises on expiry of the Rent period, or on its early termination, as stated hereinabove in the same condition subject to natural wear and tear.\n16. That in case, where the Premises are not vacated by the Tenant, at the termination of the Rent period, the Tenant will pay damages calculated at two times the rent for any period of occupation commencing from the expiry of the Rent period. The payment of damages as aforesaid will not preclude the Owner from initiating legal proceedings against the Tenant for recovering possession of premises or for any other purpose.\n17. That both the parties shall observe and adhere to the terms and conditions contained hereinabove.\n18. That the Tenant and Owners represent and warrant that they are fully empowered and competent to make this Rent. That both the parties have read over and understood all the contents of this agreement and have signed the same without any force or pressure from any side.\n29. In case of any dispute to this agreement and the clauses herein, the same will be settled in the jurisdiction of the ${placeUpper} civil courts.\n20. That the Rent Agreement will be registered in front of the Registrar and the charges towards stamp duty, court fee & lawyer/coordinator will be equally borne by the Owner and Tenant.\n\nANNEXURE-I\nThe ${propertyAddress}, consisting ${bedrooms} bedrooms, living room, family lounge, kitchen, servant room and inbuilt fittings & fixtures and inventory of ${fans} Fans, ${lights} CFL Lights, ${geysers} Geyser, ${mirrors} Mirrors, ${taps} Taps.\n\nIN WITNESS WHEREOF BOTH PARTIES AGREES AND SIGNS THIS AGREEMENT ON THIS DAY AND YEAR\nWITNESSES:\n${witnessName}\n${witnessAddress}`;

    function splitTextIntoParts(text, parts) {
      const paragraphs = text.split(/\n+/);
      const perPart = Math.ceil(paragraphs.length / parts);
      const result = [];
      for (let i = 0; i < parts; i++) {
        result.push(paragraphs.slice(i * perPart, (i + 1) * perPart).join('\n\n'));
      }
      return result;
    }
    const legalParts = splitTextIntoParts(legalText, 3);

    doc.fontSize(10).fillColor('#222').font('Helvetica').text(legalParts[0], 50, y, { width: doc.page.width - 120, align: 'justify' });
    doc.addPage();

    doc.fontSize(10).fillColor('#222').font('Helvetica').text(legalParts[1], 50, 50, { width: doc.page.width - 120, align: 'justify' });
    doc.addPage();
  
    doc.fontSize(10).fillColor('#222').font('Helvetica').text(legalParts[2], 50, 50, { width: doc.page.width - 120, align: 'justify' });
    doc.moveDown(2);

    const sigBoxWidth = 180;
    const sigBoxHeight = 70;
    const sigBoxSpacing = 60;
    const landlordX = 100;
    const tenantX = landlordX + sigBoxWidth + sigBoxSpacing;
    function drawSignatureBox(x, label, signature, name) {
      const boxY = doc.y;
      doc.roundedRect(x, boxY, sigBoxWidth, sigBoxHeight, 10).stroke('#bdbdbd');
      doc.fontSize(12).fillColor('#222').font('Helvetica-Bold').text(label, x + 10, boxY + 8);
      if (signature?.signed && signature.signatureImage) {
        try {
          let base64Data = signature.signatureImage;
          if (base64Data.includes(',')) base64Data = base64Data.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          doc.image(buffer, x + 10, boxY + 25, { width: sigBoxWidth - 20, height: 30, fit: [sigBoxWidth - 20, 30] });
          doc.fontSize(8).fillColor('#6b7280').font('Helvetica').text(`Signed: ${signature.signedAt ? new Date(signature.signedAt).toLocaleDateString() : ''}`, x + 10, boxY + 58);
          if (signature.signatureText) {
            doc.fontSize(8).fillColor('#222').font('Helvetica').text(signature.signatureText, x + 10, boxY + 65);
          }
        } catch (e) {
          doc.fontSize(10).fillColor('#e11d48').font('Helvetica').text('Signature image error', x + 10, boxY + 40);
        }
      } else {
        doc.moveTo(x + 10, boxY + 40).lineTo(x + sigBoxWidth - 10, boxY + 40).stroke('#bdbdbd');
        doc.fontSize(10).fillColor('#6b7280').font('Helvetica').text('Not signed yet', x + 10, boxY + 45);
      }
      doc.fontSize(11).fillColor('#222').font('Helvetica-Bold').text(name, x + 10, boxY + sigBoxHeight + 18);
    }

    drawSignatureBox(landlordX, 'Landlord', contract.signatures.landlord, landlordName);
    drawSignatureBox(tenantX, 'Tenant', contract.signatures.tenant, tenantName);
    doc.moveDown(6);

    doc.fontSize(11).fillColor('#14532d').font('Helvetica-Bold').text('WITNESS:', 50);
    doc.fontSize(11).fillColor('#222').font('Helvetica').text(`NAME: ${witnessName}`, 50);
    doc.fontSize(11).fillColor('#222').font('Helvetica').text(`ADDRESS: ${witnessAddress}`, 50);
    doc.moveDown(1);
    doc.fontSize(10).fillColor('#6b7280').font('Helvetica').text('This document is digitally generated and legally binding under Indian law.', 50, undefined, { align: 'left' });

    try {
      const sealPath = path.join(__dirname, '../../assets/rentify-seal.png');
      const sealWidth = 100;
      const sealHeight = 100;
      const sealX = doc.page.width - sealWidth - 40;
      const sealY = doc.y;
      if (sealY + sealHeight < doc.page.height - 60) {
        doc.image(sealPath, sealX, sealY, { width: sealWidth, height: sealHeight, opacity: 0.7 });
        doc.moveDown(7);
      }
    } catch (e) { console.error('Rentify seal image error:', e); }

    while (doc.bufferedPageRange().count < 3) {
      doc.addPage();
    }

 
    const addFooterAndWatermark = () => {
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
  
        doc.fontSize(10).fillColor('#6b7280').font('Helvetica').text('This document is digitally generated and legally binding under Indian law.', 0, doc.page.height - 30, { align: 'center' });
        
        doc.fontSize(60).fillColor('#f3f4f6').opacity(0.1).font('Helvetica-Bold').text('DIGITAL', 100, 400, { angle: 45 });
        doc.fontSize(60).fillColor('#f3f4f6').opacity(0.1).font('Helvetica-Bold').text('CONTRACT', 200, 500, { angle: 45 });
        doc.opacity(1);
      }
    };
    doc.on('end', addFooterAndWatermark);

    doc.end();

  } catch (err) {
    console.error('Error generating PDF:', err);
    try { console.error('Contract object:', JSON.stringify(contract, null, 2)); } catch (e) {}
    if (!res.headersSent) {
      res.status(500).json({ message: err.message });
    }
  }
}; 