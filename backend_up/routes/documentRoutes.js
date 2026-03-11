const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  getDocuments,
  updateDocumentStatus,
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.route('/').post(protect, uploadDocument).get(protect, getDocuments);
router.route('/:id/status').put(protect, admin, updateDocumentStatus);

module.exports = router;
