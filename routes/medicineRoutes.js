const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const Medicine   = require('../models/Medicine');
const MedicalShop = require('../models/MedicalShop');
const { protect, shopOwnerOnly } = require('../middleware/authMiddleware');

// Uploads setup
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, 'med_' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET medicines for a shop (public)
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { sort } = req.query;
    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc')  sortObj = { price: 1 };
    if (sort === 'price_desc') sortObj = { price: -1 };
    if (sort === 'name_asc')   sortObj = { name: 1 };
    if (sort === 'name_desc')  sortObj = { name: -1 };

    const medicines = await Medicine.find({ shop: req.params.shopId }).sort(sortObj);
    res.json(medicines);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST add medicine (shop owner only)
router.post('/', protect, shopOwnerOnly, upload.single('image'), async (req, res) => {
  try {
    const shop = await MedicalShop.findOne({ owner: req.user._id });
    if (!shop) return res.status(404).json({ message: 'You have no registered shop' });

    const medicine = await Medicine.create({
      shop:        shop._id,
      name:        req.body.name,
      brand:       req.body.brand || '',
      price:       Number(req.body.price),
      category:    req.body.category || 'General',
      description: req.body.description || '',
      image:       req.file ? req.file.filename : '',
      inStock:     req.body.inStock !== 'false'
    });
    res.status(201).json(medicine);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET my medicines (shop owner)
router.get('/my', protect, shopOwnerOnly, async (req, res) => {
  try {
    const shop = await MedicalShop.findOne({ owner: req.user._id });
    if (!shop) return res.json([]);
    const medicines = await Medicine.find({ shop: shop._id }).sort({ createdAt: -1 });
    res.json(medicines);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update medicine (shop owner)
router.put('/:id', protect, shopOwnerOnly, upload.single('image'), async (req, res) => {
  try {
    const shop = await MedicalShop.findOne({ owner: req.user._id });
    if (!shop) return res.status(404).json({ message: 'No shop found' });

    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    if (medicine.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: 'Not your medicine' });
    }

    medicine.name        = req.body.name        || medicine.name;
    medicine.brand       = req.body.brand        ?? medicine.brand;
    medicine.price       = req.body.price        ? Number(req.body.price) : medicine.price;
    medicine.category    = req.body.category     || medicine.category;
    medicine.description = req.body.description  ?? medicine.description;
    medicine.inStock     = req.body.inStock !== undefined ? req.body.inStock !== 'false' : medicine.inStock;
    if (req.file) medicine.image = req.file.filename;

    await medicine.save();
    res.json(medicine);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE medicine (shop owner)
router.delete('/:id', protect, shopOwnerOnly, async (req, res) => {
  try {
    const shop = await MedicalShop.findOne({ owner: req.user._id });
    if (!shop) return res.status(404).json({ message: 'No shop found' });

    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    if (medicine.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: 'Not your medicine' });
    }

    await medicine.deleteOne();
    res.json({ message: 'Medicine deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
