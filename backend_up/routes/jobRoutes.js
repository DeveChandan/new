const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  getJobById,
  applyToJob,
  updateJob,
  hireWorkerForJob,
  getAssignedJobs,
  getHiredJobsForEmployer, // Added this
  rejectApplicant, // Import rejectApplicant
  getEmployerJobs,
  acceptHiringRequest,
  rejectHiringRequest,
  getWorkerHiringRequests,
  updateJobLocation
} = require('../controllers/jobController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { requireActiveSubscription, checkLocationChangeLimit } = require('../middleware/subscriptionCheck');

router.route('/').post(protect, createJob).get(getJobs);
router.get('/assigned', protect, getAssignedJobs);
router.get('/hired', protect, getHiredJobsForEmployer); // Added this
router.get('/my-jobs', protect, getEmployerJobs);
router.get('/hiring-requests', protect, getWorkerHiringRequests); // Move this before /:id
router.route('/:id').get(optionalProtect, getJobById).put(protect, updateJob);
router.route('/:id/apply').post(protect, applyToJob);
router.route('/:id/hire/:workerId').put(protect, hireWorkerForJob);
router.route('/:jobId/applicants/:applicantId/reject').post(protect, rejectApplicant); // New route for rejecting applicant
router.route('/hiring-requests/:applicationId/accept').put(protect, acceptHiringRequest);
router.route('/hiring-requests/:applicationId/reject').put(protect, rejectHiringRequest);
router.get('/hiring-requests', protect, getWorkerHiringRequests);

// Update job location (requires active subscription and location change limit check)
router.patch('/:id/location', protect, requireActiveSubscription, checkLocationChangeLimit, updateJobLocation);

module.exports = router;
