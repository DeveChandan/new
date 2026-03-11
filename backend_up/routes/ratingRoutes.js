const express = require('express');
const router = express.Router();
const { createRating, getPendingRatingPrompts } = require('../controllers/ratingController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createRating);
router.route('/pending-prompts').get(protect, getPendingRatingPrompts);

module.exports = router;
