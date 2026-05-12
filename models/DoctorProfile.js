const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialization: {
    type: String,
    enum: ['Cardiologist', 'Dermatologist', 'Pediatrician', 'General Practice', 'Orthopedic', 'Psychiatrist'],
    required: true
  },
  medicalLicenseNumber: { type: String, required: true },
  registrationNumber:   { type: String, required: true },
  experience:           { type: Number, default: 0 },
  bio:                  { type: String, default: '' },
  consultationFee:      { type: Number, default: 300 },
  clinicAddress:        { type: String, default: '' },
  city:                 { type: String, default: '' },
  availability: [{
    day:       String,
    startTime: String,
    endTime:   String,
    available: { type: Boolean, default: true }
  }],
  rating:           { type: Number, default: 0 },
  totalReviews:     { type: Number, default: 0 },
  totalConsultations: { type: Number, default: 0 },
  isVerified:          { type: Boolean, default: false },
  verificationPending: { type: Boolean, default: false },
  verificationUTR:     { type: String, default: '' },
  isActive:            { type: Boolean, default: true },
  createdAt:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
