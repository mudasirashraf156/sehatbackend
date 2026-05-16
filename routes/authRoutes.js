const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const NurseProfile = require('../models/NurseProfile');
const DoctorProfile = require('../models/DoctorProfile');
const { protect } = require('../middleware/authMiddleware');
const crypto = require('crypto');
const { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/sendEmail');

const token = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
const safe = (u) => ({ _id: u._id, firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone, role: u.role, city: u.city, isVerified: u.isVerified });
const generateVerifyToken = () => crypto.randomBytes(32).toString('hex');

// Register - FIXED version
router.post('/register', async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone,
      password, role, specialization, licenseNumber, city,
      medicalLicenseNumber, registrationNumber
    } = req.body;

    // ── SECURITY: block admin/unknown roles from self-registration ──
    const allowedRoles = ['patient', 'nurse', 'shopOwner', 'doctor'];
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Invalid role. You cannot register with this role.' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user
    const user = await User.create({
      firstName, 
      lastName, 
      email, 
      phone,
      password, 
      role, 
      city: city || '',
      isVerified: false,
    });

    // Create nurse profile if role is nurse
    if (role === 'nurse') {
      await NurseProfile.create({
        user: user._id,
        specialization,
        licenseNumber,
        city: city || '',
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

    // Create doctor profile if role is doctor
    if (role === 'doctor') {
      await DoctorProfile.create({
        user: user._id,
        specialization,
        medicalLicenseNumber,
        registrationNumber,
        city: city || '',
        verificationPending: true,
        isActive: true,
        availability: [
          { day: 'Monday', startTime: '09:00', endTime: '17:00', available: true },
          { day: 'Tuesday', startTime: '09:00', endTime: '17:00', available: true },
          { day: 'Wednesday', startTime: '09:00', endTime: '17:00', available: true },
          { day: 'Thursday', startTime: '09:00', endTime: '17:00', available: true },
          { day: 'Friday', startTime: '09:00', endTime: '17:00', available: true },
        ]
      });
    }

    // Generate email verify token
    const verifyToken = generateVerifyToken();
    user.emailVerifyToken = verifyToken;
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24hrs
    await user.save();

    // Send verification email
    await sendVerificationEmail(user.email, user.firstName, verifyToken);

    // Return success response (without auto-login token since email needs verification)
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please verify your email.',
      user: safe(user)
    });
    
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email first. Check your inbox.',
        notVerified: true,
        email: user.email,
      });
    }
    
    if (role && user.role !== role) {
      return res.status(403).json({ message: `This account is registered as a ${user.role}. Please select the correct role.` });
    }
    
    res.json({ ...safe(user), token: token(user._id) });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// Me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(safe(user));
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { firstName, lastName, phone, city, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      { firstName, lastName, phone, city, address }, 
      { new: true }
    ).select('-password');
    res.json(safe(user));
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// GET /api/auth/verify-email?token=xxx
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({
      emailVerifyToken: token,
      emailVerifyExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification link' });
    }

    user.isVerified = true;
    user.emailVerifyToken = '';
    user.emailVerifyExpires = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, user.firstName, user.role);

    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const verifyToken = generateVerifyToken();
    user.emailVerifyToken = verifyToken;
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(user.email, user.firstName, verifyToken);
    res.json({ message: 'Verification email sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    // Always return success (security: don't reveal if email exists)
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken   = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await sendPasswordResetEmail(user.email, user.firstName, resetToken);
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    // Hash the incoming token and compare
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired.' });
    }

    user.password             = password;
    user.passwordResetToken   = '';
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;