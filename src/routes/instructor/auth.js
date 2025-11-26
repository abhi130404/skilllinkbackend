const express = require("express");
const router = express.Router();
const authController = require("../../controllers/instructor/authController");
const { protect } = require("../../middleware/auth");

router.post("/send_mobile_otp", authController.sendMobileOtp);
router.post("/verify_mobile_otp", authController.verifyMobileOtp);

router.post("/send_email_otp", authController.sendEmailOtp);
router.post("/verify_email_otp", authController.verifyEmailOtp);
router.post("/signup_instructor", authController.signupInstructor);
router.post("/save_login_credentials", authController.saveLoginCredentials);
router.post("/login", authController.instructorLogin);
router.put("/update_instructor/:id", protect, authController.updateInstructor);



module.exports = router;
