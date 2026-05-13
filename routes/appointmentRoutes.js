const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const { protect, patientOnly, doctorOnly } = require('../middleware/authMiddleware');

// Create appointment (patient)
router.post('/', protect, patientOnly, async (req, res) => {
  try {
    const { doctorId, doctorProfileId, bookingDate, timeSlot, notes } = req.body;
    
    // Get doctor profile for consultation fee
    const profile = await DoctorProfile.findById(doctorProfileId);
    if (!profile) return res.status(404).json({ message: 'Doctor not found' });
    
    // Check if slot is already booked
    const existing = await Appointment.findOne({
      doctor: doctorId,
      bookingDate: new Date(bookingDate),
      timeSlot: timeSlot,
      status: { $ne: 'cancelled' }
    });
    if (existing) return res.status(400).json({ message: 'Time slot is not available.' });
    
    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      doctorProfile: doctorProfileId,
      bookingDate: new Date(bookingDate),
      timeSlot,
      duration: 30,
      notes: notes || '',
      totalAmount: profile.consultationFee
    });
    
    await DoctorProfile.findByIdAndUpdate(doctorProfileId, { $inc: { totalConsultations: 1 } });
    
    const populated = await Appointment.findById(appointment._id)
      .populate('doctor', 'firstName lastName phone')
      .populate('patient', 'firstName lastName phone');
    res.status(201).json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get patient's appointments
router.get('/patient', protect, patientOnly, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'firstName lastName phone avatar')
      .populate('doctorProfile', 'specialization consultationFee city')
      .sort({ bookingDate: -1 });
    res.json(appointments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get doctor's appointments
router.get('/doctor', protect, doctorOnly, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user._id })
      .populate('patient', 'firstName lastName phone avatar city email')
      .sort({ bookingDate: 1 });
    res.json(appointments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get single appointment
router.get('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'firstName lastName phone email')
      .populate('patient', 'firstName lastName phone email address city')
      .populate('doctorProfile', 'specialization clinicAddress');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    
    // Check if user is doctor or patient in appointment
    if (req.user._id.toString() !== appointment.doctor._id.toString() &&
        req.user._id.toString() !== appointment.patient._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    res.json(appointment);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update appointment status (doctor confirms/completes, patient cancels)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, cancelReason } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    
    // Check permissions
    if (status === 'cancelled') {
      if (req.user._id.toString() !== appointment.patient._id.toString()) {
        return res.status(403).json({ message: 'Only patient can cancel' });
      }
    } else {
      if (req.user._id.toString() !== appointment.doctor._id.toString()) {
        return res.status(403).json({ message: 'Only doctor can confirm/complete' });
      }
    }
    
    appointment.status = status;
    if (cancelReason) appointment.cancelReason = cancelReason;
    await appointment.save();
    res.json(appointment);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add prescription (doctor only, when completing)
router.patch('/:id/prescription', protect, doctorOnly, async (req, res) => {
  try {
    const { prescription, videoCallLink } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (req.user._id.toString() !== appointment.doctor._id.toString()) {
      return res.status(403).json({ message: 'Only doctor can add prescription' });
    }
    
    if (prescription) appointment.prescription = prescription;
    if (videoCallLink) appointment.videoCallLink = videoCallLink;
    await appointment.save();
    res.json(appointment);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
