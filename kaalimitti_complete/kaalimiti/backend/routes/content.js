const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// GET all content
router.get('/', async (req, res) => {
  try {
    const items = await Content.find({});
    const result = {};
    items.forEach(item => { result[item.key] = item.value; });
    res.json(result);
  } catch { res.status(500).json({ message: 'Error fetching content' }); }
});

// POST/PUT update content key
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { key, value } = req.body;
    const item = await Content.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true }
    );
    res.json(item);
  } catch { res.status(500).json({ message: 'Error saving content' }); }
});

module.exports = router;
