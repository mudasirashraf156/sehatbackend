const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
  patient:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testName:    { type: String, required: true },
  tests:       [{ type: String }],
  bookingDate: { type: Date, required: true },
  timeSlot:    { type: String, required: true },
  address:     { type: String, required: true },
  city:        { type: String, required: true },
  notes:       { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'sample_collected', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  totalAmount:    { type: Number, required: true },
  isPaid:         { type: Boolean, default: false },
  paymentMethod:  { type: String, default: 'cash' },
  assignedLab:    { type: String, default: '' },
  reportUrl:      { type: String, default: '' },
  adminNotes:     { type: String, default: '' },
  createdAt:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('LabTest', labTestSchema);