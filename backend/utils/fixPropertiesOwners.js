const mongoose = require('mongoose');
const Property = require('../models/Property');
const User = require('../models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

async function fixOwners() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const ayushi = await User.findOne({ name: 'ayushi' });
  if (!ayushi) {
    console.error('No user found with name ayushi');
    process.exit(1);
  }
  const result = await Property.updateMany(
    { $or: [ { 'owner': 'ayushi' }, { 'owner.name': 'ayushi' } ] },
    { $set: { owner: ayushi._id } }
  );
  console.log(`Updated ${result.nModified || result.modifiedCount} properties to have owner ${ayushi._id}`);
  await mongoose.disconnect();
}

fixOwners().catch(err => { console.error(err); process.exit(1); }); 