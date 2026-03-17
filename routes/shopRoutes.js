const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const MedicalShop = require('../models/MedicalShop');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET all approved shops (public)
router.get('/', async (req, res) => {
  try {
    const { city, district, search } = req.query;
    let filter = { status: 'approved', isPaid: true };
    if (city)     filter.city     = new RegExp(city, 'i');
    if (district) filter.district = new RegExp(district, 'i');
    let shops = await MedicalShop.find(filter)
      .populate('owner', 'firstName lastName')
      .sort({ isFeatured: -1, createdAt: -1 });
    if (search) {
      const s = search.toLowerCase();
      shops = shops.filter(sh =>
        sh.shopName.toLowerCase().includes(s) ||
        sh.city.toLowerCase().includes(s) ||
        sh.address.toLowerCase().includes(s)
      );
    }
    res.json(shops);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single shop
router.get('/:id', async (req, res) => {
  try {
    const shop = await MedicalShop.findById(req.params.id).populate('owner', 'firstName lastName');
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    res.json(shop);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST register shop (protected)
router.post('/register', protect, upload.single('shopImage'), async (req, res) => {
  try {
    const existing = await MedicalShop.findOne({ owner: req.user._id });
    if (existing) return res.status(400).json({ message: 'You already have a registered shop' });
    const shopData = {
      ...req.body,
      owner: req.user._id,
      services: req.body.services ? req.body.services.split(',') : [],
      image: req.file ? req.file.filename : ''
    };
    const shop = await MedicalShop.create(shopData);
    res.status(201).json(shop);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH mark as paid (after payment)
router.patch('/:id/pay', protect, async (req, res) => {
  try {
    const shop = await MedicalShop.findByIdAndUpdate(
      req.params.id,
      { isPaid: true, paymentRef: req.body.paymentRef || 'MANUAL' },
      { new: true }
    );
    res.json(shop);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET my shop
router.get('/my/shop', protect, async (req, res) => {
  try {
    const shop = await MedicalShop.findOne({ owner: req.user._id });
    res.json(shop);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ADMIN — get all shops
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const shops = await MedicalShop.find()
      .populate('owner', 'firstName lastName email phone')
      .sort({ createdAt: -1 });
    res.json(shops);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ADMIN — approve / reject
router.patch('/admin/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const shop = await MedicalShop.findByIdAndUpdate(
      req.params.id,
      { status, isVerified: status === 'approved' },
      { new: true }
    );
    res.json(shop);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;