const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.post('/', uploadLimiter, upload.single('file'), (req, res) => {
  res.status(200).json({
    message: 'File uploaded successfully',
    fileUrl: `/uploads/${req.file.filename}`,
  });
});

module.exports = router;
