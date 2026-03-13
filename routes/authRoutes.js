const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const NurseProfile = require('../models/NurseProfile');
const { protect } = require('../middleware/authMiddleware');

const token = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
const safe = (u) => ({ _id: u._id, firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone, role: u.role, city: u.city, isVerified: u.isVerified });

// Register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role, specialization, licenseNumber, city } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ firstName, lastName, email, phone, password, role, city: city || '' });
    if (role === 'nurse') {
      await NurseProfile.create({
        user: user._id, specialization, licenseNumber, city: city || '',
        services: ['General Care', 'Medication Administration', 'Vital Signs Monitoring'],
        availability: [
          { day: 'Monday', startTime: '08:00', endTime: '18:00', available: true },
          { day: 'Tuesday', startTime: '08:00', endTime: '18:00', available: true },
          { day: 'Wednesday', startTime: '08:00', endTime: '18:00', available: true },
          { day: 'Thursday', startTime: '08:00', endTime: '18:00', available: true },
          { day: 'Friday', startTime: '08:00', endTime: '18:00', available: true },
        ]
      });
    }
    res.status(201).json({ ...safe(user), token: token(user._id) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    if (role && user.role !== role)
      return res.status(403).json({ message: `This account is registered as a ${user.role}. Please select the correct role.` });
    res.json({ ...safe(user), token: token(user._id) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(safe(user));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { firstName, lastName, phone, city, address } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { firstName, lastName, phone, city, address }, { new: true }).select('-password');
    res.json(safe(user));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
