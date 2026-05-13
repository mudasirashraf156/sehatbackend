const express = require('express');
const router = express.Router();
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const { protect, doctorOnly } = require('../middleware/authMiddleware');

// POST apply for verification (doctor pays ₹99, submits UTR)
router.post('/apply-verification', protect, doctorOnly, async (req, res) => {
  try {
    const { utr } = req.body;
    if (!utr) return res.status(400).json({ message: 'UTR / Transaction ID is required.' });
    const profile = await DoctorProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Doctor profile not found.' });
    if (profile.isVerified) return res.status(400).json({ message: 'Already verified.' });
    profile.verificationPending = true;
    profile.verificationUTR = utr;
    await profile.save();
    res.json({ message: 'Verification request submitted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET all doctors (public) with filters
router.get('/', async (req, res) => {
  try {
    const { city, specialization, minRating, search } = req.query;
    let filter = { isActive: true, isVerified: true };
    if (city) filter.city = new RegExp(city, 'i');
    if (specialization) filter.specialization = specialization;
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };

    let doctors = await DoctorProfile.find(filter)
      .populate('user', 'firstName lastName email avatar city phone')
      .sort({ rating: -1, totalConsultations: -1 });

    if (search) {
      const s = search.toLowerCase();
      doctors = doctors.filter(d =>
        d.user.firstName.toLowerCase().includes(s) ||
        d.user.lastName.toLowerCase().includes(s) ||
        d.specialization.toLowerCase().includes(s) ||
        d.city?.toLowerCase().includes(s)
      );
    }
    res.json(doctors);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single doctor
router.get('/:id', async (req, res) => {
  try {
    const doctor = await DoctorProfile.findById(req.params.id)
      .populate('user', 'firstName lastName email avatar city phone createdAt');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    const reviews = await Review.find({ nurse: doctor.user._id })
      .populate('patient', 'firstName lastName avatar')
      .sort({ createdAt: -1 }).limit(10);
    res.json({ doctor, reviews });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET my doctor profile
router.get('/my/profile', protect, doctorOnly, async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ user: req.user._id })
      .populate('user', 'firstName lastName email phone avatar city');
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH update doctor profile
router.patch('/my/profile', protect, doctorOnly, async (req, res) => {
  try {
    const { bio, consultationFee, clinicAddress, city, availability, experience } = req.body;
    const profile = await DoctorProfile.findOneAndUpdate(
      { user: req.user._id },
      { bio, consultationFee, clinicAddress, city, availability, experience },
      { new: true }
    ).populate('user', 'firstName lastName email phone city');
    // also update user city
    if (city) await User.findByIdAndUpdate(req.user._id, { city });
    res.json(profile);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET doctor's available slots for a date
router.get('/my/available-slots/:date', protect, doctorOnly, async (req, res) => {
  try {
    const dateString = req.params.date; // format: YYYY-MM-DD
    const appointments = await Appointment.find({
      doctor: req.user._id,
      bookingDate: {
        $gte: new Date(dateString),
        $lt: new Date(new Date(dateString).getTime() + 24 * 60 * 60 * 1000)
      },
      status: { $ne: 'cancelled' }
    }).select('timeSlot');
    
    const bookedSlots = appointments.map(a => a.timeSlot);
    res.json({ bookedSlots });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
