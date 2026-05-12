const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorProfile:{ type: mongoose.Schema.Types.ObjectId, ref: 'DoctorProfile' },
  bookingDate:  { type: Date, required: true },
  timeSlot:     { type: String, required: true },
  duration:     { type: Number, default: 30 },
  notes:        { type: String, default: '' },
  status:       {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  videoCallLink: { type: String, default: '' },
  startTime:     { type: Date },
  endTime:       { type: Date },
  prescription:  { type: String, default: '' },
  totalAmount:   { type: Number, required: true },
  isPaid:        { type: Boolean, default: false },
  cancelReason:  { type: String, default: '' },
  createdAt:     { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
