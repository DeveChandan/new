const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, uploadLimiter, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      // Multer errors (file type, size) — return 400 with message
      return res.status(400).json({ message: err.message || 'File upload error' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.status(200).json({
      message: 'File uploaded successfully',
      fileUrl: `/uploads/${req.file.filename}`,
    });
  });
});

module.exports = router;
