const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { upload } = require('../services/s3');

router.post('/', protect, adminOnly, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.log('Upload error:', err.message);
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    console.log('Upload success:', req.file.location);
    res.json({ url: req.file.location, filename: req.file.key });
  });
});

module.exports = router;
