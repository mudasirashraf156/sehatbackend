const express = require('express');
const router = express.Router();
const User = require('../models/User');
const NurseProfile = require('../models/NurseProfile');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);

router.get('/stats', async (req, res) => {
  try {
    const LabTest = require('../models/LabTest');
const [totalPatients, totalNurses, totalBookings, pendingVerifications, totalLabTests] = await Promise.all([
  User.countDocuments({ role: 'patient' }),
  User.countDocuments({ role: 'nurse' }),
  Booking.countDocuments(),
  NurseProfile.countDocuments({ isVerified: false }),
  LabTest.countDocuments({ status: 'pending' })
    ]);
    const recentBookings = await Booking.find().sort({ createdAt: -1 }).limit(5)
      .populate('patient', 'firstName lastName').populate('nurse', 'firstName lastName');
    res.json({ totalPatients, totalNurses, totalBookings, pendingVerifications, recentBookings });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/nurses', async (req, res) => {
  try {
    const nurses = await NurseProfile.find().populate('user', 'firstName lastName email phone city isActive createdAt');
    res.json(nurses);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/nurses/:id/verify', async (req, res) => {
  try {
    const profile = await NurseProfile.findByIdAndUpdate(req.params.id, { isVerified: req.body.verify }, { new: true });
    await User.findByIdAndUpdate(profile.user, { isVerified: req.body.verify });
    res.json(profile);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
