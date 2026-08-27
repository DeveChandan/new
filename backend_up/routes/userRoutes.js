const express = require('express');
const router = express.Router();
const {
  registerUser,
  initiateRegistration,
  completeRegistration,
  loginUser,
  logoutUser,
  getUserProfile,
  getPublicUserProfile,
  updateUserProfile,
  getWorkerDashboard,
  getEmployerDashboard,
  getEmployerAnalytics,
  searchWorkers,
  getWorkerCompletedJobs,
  updateCompanyProfile,
  updateSubscription,
  unlockWorkerProfile,
  updatePushToken,
  checkMobile,
  changePassword,
  initiateChangeMobile,
  verifyChangeMobile
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { requireActiveSubscription, checkDatabaseUnlockLimit } = require('../middleware/subscriptionCheck');
const { otpLimiter, authLimiter } = require('../middleware/rateLimiter');

router.post('/check-mobile', otpLimiter, checkMobile);
router.post('/initiate-register', otpLimiter, initiateRegistration);
router.post('/register-initiate', otpLimiter, initiateRegistration); // Alias for backward compatibility
router.post('/complete-register', authLimiter, completeRegistration);
router.post('/register-complete', authLimiter, completeRegistration); // Alias for backward compatibility
router.post('/', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/logout', protect, logoutUser);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.get('/profile/:id', protect, getPublicUserProfile);
router.get('/dashboard/worker', protect, getWorkerDashboard);
router.get('/dashboard/employer', protect, getEmployerDashboard);
router.get('/dashboard/employer/analytics', protect, getEmployerAnalytics);
router.get('/search/workers', protect, searchWorkers);
router.get('/:userId/completed-jobs', protect, getWorkerCompletedJobs);
router.put('/:userId/company-profile', protect, updateCompanyProfile);
router.put('/subscription', protect, admin, updateSubscription);

// Unlock worker profile (requires active subscription and database unlock limit check)
// Unlock worker profile (requires active subscription and database unlock limit check)
router.post('/workers/:id/unlock', protect, requireActiveSubscription, checkDatabaseUnlockLimit, unlockWorkerProfile);

router.put('/push-token', protect, updatePushToken);

router.put('/change-password', protect, changePassword);

// Change Mobile Number with OTP Verification
router.post('/change-mobile/send-otp', protect, otpLimiter, initiateChangeMobile);
router.post('/change-mobile/verify-otp', protect, authLimiter, verifyChangeMobile);

module.exports = router;
