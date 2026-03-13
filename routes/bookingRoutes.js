const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const NurseProfile = require('../models/NurseProfile');
const { protect, patientOnly, nurseOnly } = require('../middleware/authMiddleware');

// Create booking (patient)
router.post('/', protect, patientOnly, async (req, res) => {
  try {
    const { nurseId, nurseProfileId, service, bookingDate, timeSlot, address, city, notes, hours } = req.body;
    const profile = await NurseProfile.findById(nurseProfileId);
    if (!profile) return res.status(404).json({ message: 'Nurse not found' });
    const totalAmount = profile.hourlyRate * (hours || 1);
    const booking = await Booking.create({
      patient: req.user._id, nurse: nurseId, nurseProfile: nurseProfileId,
      service, bookingDate, timeSlot, address, city, notes: notes || '',
      hours: hours || 1, totalAmount
    });
    await NurseProfile.findByIdAndUpdate(nurseProfileId, { $inc: { totalBookings: 1 } });
    const populated = await Booking.findById(booking._id)
      .populate('nurse', 'firstName lastName phone')
      .populate('patient', 'firstName lastName phone');
    res.status(201).json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get patient's bookings
router.get('/patient', protect, patientOnly, async (req, res) => {
  try {
    const bookings = await Booking.find({ patient: req.user._id })
      .populate('nurse', 'firstName lastName phone avatar')
      .populate('nurseProfile', 'specialization hourlyRate city')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get nurse's bookings
router.get('/nurse', protect, nurseOnly, async (req, res) => {
  try {
    const bookings = await Booking.find({ nurse: req.user._id })
      .populate('patient', 'firstName lastName phone avatar city address')
      .sort({ bookingDate: 1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update booking status (nurse confirms/cancels, patient cancels)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, cancelReason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    booking.status = status;
    if (cancelReason) booking.cancelReason = cancelReason;
    await booking.save();
    res.json(booking);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
