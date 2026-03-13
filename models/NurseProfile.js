const mongoose = require('mongoose');

const nurseProfileSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialization: {
    type: String,
    enum: ['General Nursing','ICU / Critical Care','Pediatric Nursing','Midwifery','Wound Care','Phlebotomy','Elderly Care','Post-Op Care'],
    required: true
  },
  licenseNumber:  { type: String, required: true },
  experience:     { type: Number, default: 0 },
  bio:            { type: String, default: '' },
  hourlyRate:     { type: Number, default: 800 },
  city:           { type: String, default: '' },
  services:       [{ type: String }],
  availability: [{
    day:       String,
    startTime: String,
    endTime:   String,
    available: { type: Boolean, default: true }
  }],
  rating:         { type: Number, default: 0 },
  totalReviews:   { type: Number, default: 0 },
  totalBookings:  { type: Number, default: 0 },
  isVerified:     { type: Boolean, default: false },
  isActive:       { type: Boolean, default: true },
  createdAt:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('NurseProfile', nurseProfileSchema);
