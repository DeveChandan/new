const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { translateContent } = require('../controllers/translationController');

router.post('/', protect, translateContent);

module.exports = router;
