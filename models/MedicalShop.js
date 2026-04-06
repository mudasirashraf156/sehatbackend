const mongoose = require('mongoose');

const medicalShopSchema = new mongoose.Schema({
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shopName:    { type: String, required: true, trim: true },
  ownerName:   { type: String, required: true },
  phone:       { type: String, required: true },
  whatsapp:    { type: String, default: '' },
  email:       { type: String, default: '' },
  address:     { type: String, required: true },
  city:        { type: String, required: true },
  district:    { type: String, required: true },
  pincode:     { type: String, default: '' },
  description: { type: String, default: '' },
  image:       { type: String, default: '' },
  licenseNo:   { type: String, required: true },
  services:    [{ type: String }],
  timing:      { type: String, default: '9:00 AM – 9:00 PM' },
  isOpen24x7:  { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isPaid:         { type: Boolean, default: false },
  paymentPending: { type: Boolean, default: false },
  paymentRef:     { type: String, default: '' },
  registrationFee: { type: Number, default: 99 },
  rating:      { type: Number, default: 0 },
  totalReviews:{ type: Number, default: 0 },
  isVerified:  { type: Boolean, default: false },
  isFeatured:  { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('MedicalShop', medicalShopSchema);