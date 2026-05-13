const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid' });
  }
};

exports.nurseOnly   = (req, res, next) => req.user?.role === 'nurse'   ? next() : res.status(403).json({ message: 'Nurses only' });
exports.patientOnly = (req, res, next) => req.user?.role === 'patient' ? next() : res.status(403).json({ message: 'Patients only' });
exports.adminOnly   = (req, res, next) => req.user?.role === 'admin'   ? next() : res.status(403).json({ message: 'Admins only' });
exports.shopOwnerOnly = (req, res, next) => req.user?.role === 'shopOwner' ? next() : res.status(403).json({ message: 'Shop owners only' });
exports.doctorOnly  = (req, res, next) => req.user?.role === 'doctor'  ? next() : res.status(403).json({ message: 'Doctors only' });