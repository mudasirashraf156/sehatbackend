const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  shop:        { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalShop', required: true },
  name:        { type: String, required: true, trim: true },
  brand:       { type: String, default: '', trim: true },
  price:       { type: Number, required: true, min: 0 },
  category:    { type: String, default: 'General', trim: true },
  description: { type: String, default: '' },
  image:       { type: String, default: '' },
  inStock:     { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Medicine', medicineSchema);
