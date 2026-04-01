const express = require('express');
const router = express.Router();
const User = require('../models/User');
const NurseProfile = require('../models/NurseProfile');
const Review = require('../models/Review');
const { protect, nurseOnly } = require('../middleware/authMiddleware');

// POST apply for verification (nurse pays ₹99, submits UTR)
router.post('/apply-verification', protect, nurseOnly, async (req, res) => {
  try {
    const { utr } = req.body;
    if (!utr) return res.status(400).json({ message: 'UTR / Transaction ID is required.' });
    const profile = await NurseProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Nurse profile not found.' });
    if (profile.isVerified) return res.status(400).json({ message: 'Already verified.' });
    profile.verificationPending = true;
    profile.verificationUTR = utr;
    await profile.save();
    res.json({ message: 'Verification request submitted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET all nurses (public) with filters
router.get('/', async (req, res) => {
  try {
    const { city, specialization, minRating, maxRate, search } = req.query;
    let filter = { isActive: true };
    if (city) filter.city = new RegExp(city, 'i');
    if (specialization) filter.specialization = specialization;
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };
    if (maxRate) filter.hourlyRate = { $lte: parseInt(maxRate) };

    let nurses = await NurseProfile.find(filter)
      .populate('user', 'firstName lastName email avatar city phone')
      .sort({ isVerified: -1, rating: -1 });

    if (search) {
      const s = search.toLowerCase();
      nurses = nurses.filter(n =>
        n.user.firstName.toLowerCase().includes(s) ||
        n.user.lastName.toLowerCase().includes(s) ||
        n.specialization.toLowerCase().includes(s) ||
        n.city?.toLowerCase().includes(s)
      );
    }
    res.json(nurses);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single nurse
router.get('/:id', async (req, res) => {
  try {
    const nurse = await NurseProfile.findById(req.params.id)
      .populate('user', 'firstName lastName email avatar city phone createdAt');
    if (!nurse) return res.status(404).json({ message: 'Nurse not found' });
    const reviews = await Review.find({ nurse: nurse.user._id })
      .populate('patient', 'firstName lastName avatar')
      .sort({ createdAt: -1 }).limit(10);
    res.json({ nurse, reviews });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET my nurse profile
router.get('/my/profile', protect, nurseOnly, async (req, res) => {
  try {
    const profile = await NurseProfile.findOne({ user: req.user._id })
      .populate('user', 'firstName lastName email phone avatar city');
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update nurse profile
router.put('/my/profile', protect, nurseOnly, async (req, res) => {
  try {
    const { bio, hourlyRate, city, services, availability, experience } = req.body;
    const profile = await NurseProfile.findOneAndUpdate(
      { user: req.user._id },
      { bio, hourlyRate, city, services, availability, experience },
      { new: true }
    ).populate('user', 'firstName lastName email phone city');
    // also update user city
    if (city) await User.findByIdAndUpdate(req.user._id, { city });
    res.json(profile);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
