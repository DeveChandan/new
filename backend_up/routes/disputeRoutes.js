const express = require('express');
const router = express.Router();
const {
  createDispute,
  getDisputes,
  resolveDispute,
} = require('../controllers/disputeController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.route('/').post(protect, createDispute).get(protect, admin, getDisputes);
router.route('/:id/resolve').put(protect, admin, resolveDispute);

module.exports = router;
