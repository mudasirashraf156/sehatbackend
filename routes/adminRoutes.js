const express = require('express');
const router = express.Router();
const User = require('../models/User');
const NurseProfile = require('../models/NurseProfile');
const DoctorProfile = require('../models/DoctorProfile');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);

router.get('/stats', async (req, res) => {
  try {
    const LabTest = require('../models/LabTest');
const [totalPatients, totalNurses, totalDoctors, totalBookings, pendingNurseVerifications, pendingDoctorVerifications, totalLabTests] = await Promise.all([
  User.countDocuments({ role: 'patient' }),
  User.countDocuments({ role: 'nurse' }),
  User.countDocuments({ role: 'doctor' }),
  Booking.countDocuments(),
  NurseProfile.countDocuments({ isVerified: false }),
  DoctorProfile.countDocuments({ isVerified: false }),
  LabTest.countDocuments({ status: 'pending' })
    ]);
    const recentBookings = await Booking.find().sort({ createdAt: -1 }).limit(5)
      .populate('patient', 'firstName lastName').populate('nurse', 'firstName lastName');
    res.json({ totalPatients, totalNurses, totalDoctors, totalBookings, pendingNurseVerifications, pendingDoctorVerifications, recentBookings });
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
    const profile = await NurseProfile.findByIdAndUpdate(
      req.params.id,
      { isVerified: req.body.verify, verificationPending: false },
      { new: true }
    );
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

router.get('/doctors', async (req, res) => {
  try {
    const doctors = await DoctorProfile.find().populate('user', 'firstName lastName email phone city isActive createdAt');
    res.json(doctors);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/doctors/:id/verify', async (req, res) => {
  try {
    const profile = await DoctorProfile.findByIdAndUpdate(
      req.params.id,
      { isVerified: req.body.verify, verificationPending: false },
      { new: true }
    );
    await User.findByIdAndUpdate(profile.user, { isVerified: req.body.verify });
    res.json(profile);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
