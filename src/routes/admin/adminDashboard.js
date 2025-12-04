const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/admin/adminDashboardController");

router.get('/stats', ctrl.getDashboardStats);

module.exports = router;
