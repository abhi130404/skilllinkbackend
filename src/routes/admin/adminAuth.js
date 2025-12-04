const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/admin/adminAuthController");
const { protect } = require("../../middleware/auth");

router.post("/send_mobile_otp", ctrl.sendMobileOtp);
router.post("/verify_mobile_otp", ctrl.verifyMobileOtp);

router.post("/send_email_otp", ctrl.sendEmailOtp);
router.post("/verify_email_otp", ctrl.verifyEmailOtp);
router.post("/signup", ctrl.signupAdmin);
router.post("/save_login_credentials", ctrl.saveLoginCredentials);
router.post("/login", ctrl.adminLogin);
router.put("/update/:id", protect, ctrl.updateAdmin);



module.exports = router;
