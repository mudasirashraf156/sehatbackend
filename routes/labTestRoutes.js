const express  = require('express');
const router   = express.Router();
const LabTest  = require('../models/LabTest');
const { protect, patientOnly, adminOnly } = require('../middleware/authMiddleware');

// POST — patient books a test
router.post('/', protect, patientOnly, async (req, res) => {
  try {
    const { tests, bookingDate, timeSlot, address, city, notes, totalAmount, paymentMethod } = req.body;
    const testName = Array.isArray(tests) ? tests.join(', ') : tests;
    const order = await LabTest.create({
      patient: req.user._id,
      testName, tests, bookingDate, timeSlot,
      address, city, notes: notes || '',
      totalAmount, paymentMethod: paymentMethod || 'cash'
    });
    res.status(201).json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET — patient's own test orders
router.get('/my', protect, patientOnly, async (req, res) => {
  try {
    const orders = await LabTest.find({ patient: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET — admin sees all orders
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const orders = await LabTest.find()
      .populate('patient', 'firstName lastName phone email city')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH — admin updates status / assigns lab / adds notes
router.patch('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, assignedLab, adminNotes, reportUrl } = req.body;
    const order = await LabTest.findByIdAndUpdate(
      req.params.id,
      { status, assignedLab, adminNotes, reportUrl },
      { new: true }
    ).populate('patient', 'firstName lastName phone');
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH — patient cancels
router.patch('/:id/cancel', protect, patientOnly, async (req, res) => {
  try {
    const order = await LabTest.findOneAndUpdate(
      { _id: req.params.id, patient: req.user._id },
      { status: 'cancelled' },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;