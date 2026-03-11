const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createApplication, getApplicationsForJob, getAllApplicationsForEmployer, getWorkerApplications } = require('../controllers/applicationController');

// @route   POST api/applications/:jobId
// @desc    Apply for a job
// @access  Private (Worker)
router.route('/:jobId').post(protect, authorize('worker'), createApplication);

router.route('/job/:jobId').get(protect, authorize('employer'), getApplicationsForJob);
router.route('/employer').get(protect, authorize('employer'), getAllApplicationsForEmployer);
router.route('/worker').get(protect, authorize('worker'), getWorkerApplications); // New route

module.exports = router;
