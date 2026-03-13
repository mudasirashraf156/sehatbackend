const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  booking:  { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  patient:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nurse:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating:   { type: Number, required: true, min: 1, max: 5 },
  comment:  { type: String, default: '' },
  createdAt:{ type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
