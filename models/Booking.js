const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  patient:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nurse:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nurseProfile:{ type: mongoose.Schema.Types.ObjectId, ref: 'NurseProfile' },
  service:     { type: String, required: true },
  bookingDate: { type: Date, required: true },
  timeSlot:    { type: String, required: true },
  address:     { type: String, required: true },
  city:        { type: String, required: true },
  notes:       { type: String, default: '' },
  status:      {
    type: String,
    enum: ['pending','confirmed','in-progress','completed','cancelled'],
    default: 'pending'
  },
  hours:       { type: Number, default: 1 },
  totalAmount: { type: Number, required: true },
  isPaid:      { type: Boolean, default: false },
  cancelReason:{ type: String, default: '' },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
