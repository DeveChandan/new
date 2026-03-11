const express = require('express');
const router = express.Router();
const {
  createWorkLog,
  getWorkLogByJob,
  updateWorkLog,
  generateStartOtp,
  verifyStartOtp,
  generateEndOtp,
  verifyEndOtp,
  getWorkLogsByJob,
  updateWorkLogPhoto,
  getWorkLogsForWorker, // New import
} = require('../controllers/workLogController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createWorkLog);
router.route('/job/:jobId').get(protect, getWorkLogByJob);
router.route('/job/:jobId/all').get(protect, getWorkLogsByJob);
router.route('/:id').put(protect, updateWorkLog);

router.route('/job/:jobId/worker/:workerId/generate-start-otp').post(protect, generateStartOtp);
router.route('/job/:jobId/worker/:workerId/verify-start-otp').post(protect, verifyStartOtp);
router.route('/job/:jobId/worker/:workerId/generate-end-otp').post(protect, generateEndOtp);
router.route('/job/:jobId/worker/:workerId/verify-end-otp').post(protect, verifyEndOtp);
router.route('/job/:jobId/worker/:workerId/photo').put(protect, updateWorkLogPhoto);

router.route('/worker').get(protect, getWorkLogsForWorker); // New route

module.exports = router;