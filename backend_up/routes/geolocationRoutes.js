const express = require('express');
const router = express.Router();
const { reverseGeocode, updateWorkerLocation, getWorkerLatestLocation, getWorkerRoute, calculateRoute } = require('../controllers/geolocationController');
const { protect } = require('../middleware/authMiddleware'); // Assuming this route should be protected

router.route('/reverse').get(protect, reverseGeocode);
router.route('/worker/:workerId/job/:jobId/location').post(protect, updateWorkerLocation);
router.route('/worker/:workerId/job/:jobId/latest').get(protect, getWorkerLatestLocation);
router.route('/worker/:workerId/job/:jobId/route').get(protect, getWorkerRoute);
router.route('/calculate-route').get(protect, calculateRoute); // New route for calculating a route

module.exports = router;
