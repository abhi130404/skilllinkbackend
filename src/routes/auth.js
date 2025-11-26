const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/send_mobile_otp", authController.sendMobileOtp);
router.post("/verify_mobile_otp", authController.verifyMobileOtp);

router.post("/send_email_otp", authController.sendEmailOtp);
router.post("/verify_email_otp", authController.verifyEmailOtp);

router.post("/register_user", authController.registerUser);
router.post("/save_user_login_credential", authController.saveLoginCredentials);
router.post("/login", authController.userLogin);

router.post("/oauth", authController.oauthLogin);

module.exports = router;
