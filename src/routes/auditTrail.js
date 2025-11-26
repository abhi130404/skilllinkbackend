const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/auditTrailController");

router.get('/:collectionName/:id', protect, ctrl.getCollectionAuditTrails);

// Get audit summary for a document
// GET /api/audit/Listing/507f1f77bcf86cd799439011/summary
router.get('/:collectionName/:id/summary', protect, ctrl.getAuditSummary);

// Get audit trails for a specific user across all collections
// GET /api/audit/user/507f1f77bcf86cd799439011
router.get('/user/:userId', protect, ctrl.getUserAuditTrails);

// Get current user's audit trails
// GET /api/audit/me/activities
router.get('/me/activities', protect, ctrl.getMyAuditTrails);

// Get system-wide audit trails (Admin only)
// GET /api/audit/system/activities
router.get('/system/activities', protect, ctrl.getSystemAuditTrails);

// Get recent activities across system
// GET /api/audit/recent/activities
router.get('/recent/activities', protect, ctrl.getRecentActivities);

// Export routes
module.exports = router;
