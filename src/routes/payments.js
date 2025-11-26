const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/paymentController");

router.post("/create", protect, ctrl.createPaymentIntent);
router.post("/confirm", protect, ctrl.confirmPayment);

module.exports = router;
