const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
  name:     { type: String, required: true },
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shop:            { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalShop', required: true },
  items:           [orderItemSchema],
  totalAmount:     { type: Number, required: true },
  customerEmail:   { type: String, required: true },
  customerPhone:   { type: String, required: true },
  customerAddress: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'delivered', 'cancelled'],
    default: 'pending'
  },
  adminNotes: { type: String, default: '' },
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
