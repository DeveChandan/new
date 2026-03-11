const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getUsers,
  getJobs,
  approveJob,
  approveUser,
  deleteUser,
  getRatings,
  deleteRating,
  getDocuments,
  updateDocumentStatus,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,

  getAnalytics,
  getWorklogsByWorker,
  getAllDisputes,
  getWorklogsForSingleWorker,
  getJobDetails,
  getAdminConversationMessages,
  updateWorklogStatus,
  deleteWorklog
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.route('/dashboard').get(protect, admin, getAdminDashboard);
router.route('/analytics').get(protect, admin, getAnalytics);
router.route('/users').get(protect, admin, getUsers);
router.route('/users/:id').delete(protect, admin, deleteUser);
router.route('/jobs').get(protect, admin, getJobs);
router.route('/jobs/:id/approve').put(protect, admin, approveJob);
router.route('/jobs/:id/details').get(protect, admin, getJobDetails); // New Route
router.route('/users/:id/approve').put(protect, admin, approveUser);
router.route('/ratings').get(protect, admin, getRatings);
router.route('/ratings/:id').delete(protect, admin, deleteRating);
router.route('/documents').get(protect, admin, getDocuments);
router.route('/documents/:id/status').put(protect, admin, updateDocumentStatus);
router.route('/subscriptions').get(protect, admin, getAllSubscriptions);
router.route('/subscriptions/:id').get(protect, admin, getSubscriptionById).put(protect, admin, updateSubscription).delete(protect, admin, deleteSubscription);
// router.route('/payments').get(protect, admin, getAllPayments); // Deprecated: Use /api/payments/admin/invoices
router.route('/worklogs/workers').get(protect, admin, getWorklogsByWorker);
router.route('/disputes').get(protect, admin, getAllDisputes);
router.route('/worklogs/worker/:workerId').get(protect, admin, getWorklogsForSingleWorker);
router.route('/worklogs/:id/status').put(protect, admin, updateWorklogStatus);
router.route('/worklogs/:id').delete(protect, admin, deleteWorklog);
router.route('/conversations/:conversationId/messages').get(protect, admin, getAdminConversationMessages); // New Route

module.exports = router;
