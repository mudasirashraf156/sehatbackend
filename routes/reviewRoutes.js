const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const NurseProfile = require('../models/NurseProfile');
const Booking = require('../models/Booking');
const { protect, patientOnly } = require('../middleware/authMiddleware');

// Post review
router.post('/', protect, patientOnly, async (req, res) => {
  try {
    const { bookingId, nurseId, rating, comment } = req.body;
    const existing = await Review.findOne({ booking: bookingId });
    if (existing) return res.status(400).json({ message: 'Already reviewed' });
    const review = await Review.create({ booking: bookingId, patient: req.user._id, nurse: nurseId, rating, comment });
    // Update nurse avg rating
    const reviews = await Review.find({ nurse: nurseId });
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await NurseProfile.findOneAndUpdate({ user: nurseId }, { rating: Math.round(avg * 10) / 10, totalReviews: reviews.length });
    await Booking.findByIdAndUpdate(bookingId, { isPaid: true });
    res.status(201).json(review);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
