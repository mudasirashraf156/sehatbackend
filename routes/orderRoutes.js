const express = require('express');
const router  = express.Router();
const Order       = require('../models/Order');
const MedicalShop = require('../models/MedicalShop');
const { protect, adminOnly, shopOwnerOnly } = require('../middleware/authMiddleware');

// POST create order (any logged-in user)
router.post('/', protect, async (req, res) => {
  try {
    const { shopId, items, customerEmail, customerPhone, customerAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await Order.create({
      user:            req.user._id,
      shop:            shopId,
      items,
      totalAmount,
      customerEmail,
      customerPhone,
      customerAddress
    });

    res.status(201).json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET my orders (logged-in user)
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('shop', 'shopName city')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET orders for my shop (shop owner)
router.get('/shop', protect, shopOwnerOnly, async (req, res) => {
  try {
    const shop = await MedicalShop.findOne({ owner: req.user._id });
    if (!shop) return res.json([]);
    const orders = await Order.find({ shop: shop._id })
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET all orders (admin)
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'firstName lastName email phone')
      .populate('shop', 'shopName city ownerName')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH update order status (admin)
router.patch('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const update = {};
    if (status)     update.status     = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user', 'firstName lastName email phone')
      .populate('shop', 'shopName city ownerName');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
