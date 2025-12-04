const asyncHandler = require("express-async-handler");
const { Otp, AuthProvider, Admin } = require("../../models/models");
const { sign } = require("../../utils/jwt");
const bcrypt = require("bcrypt");
const axios = require("axios");

// POST /auth/send-otp
const sendMobileOtp = asyncHandler(async (req, res) => {
  try {
    const { mobileNo } = req.body;
    console.log("mobileno", mobileNo);

    if (!mobileNo)
      return res.status(400).json({ code: 1, message: "Mobile number required" });

    const user = await Admin.findOne({ mobileNo });
    if (user)
      return res.status(400).json({ code: 1, message: "Mobile number already exist" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.create({ mobile: mobileNo, otp });

    console.log("OTP sent (simulation):", otp);

    return res.json({ code: 0, message: "OTP sent", otp });
  } catch (err) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});


// POST /auth/verify-otp
const verifyMobileOtp = asyncHandler(async (req, res) => {
  try {
    const { mobileNo, otp } = req.body;

    if (!mobileNo || !otp)
      return res.status(400).json({
        code: 1,
        message: "Mobile and OTP required",
      });

    const validOtp = await Otp.findOne({ mobile: mobileNo, otp });

    if (!validOtp)
      return res.status(400).json({
        code: 1,
        message: "Invalid or expired OTP",
      });

    // delete otp after use
    await Otp.deleteMany({ mobile: mobileNo });

    return res.json({
      code: 0,
      message: "Login successful",
    });

  } catch (err) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});


// POST /auth/send-email-otp
const sendEmailOtp = asyncHandler(async (req, res) => {
  try {
    const { emailID } = req.body;
    console.log("emailID", emailID);

    if (!emailID)
      return res.status(400).json({ code: 1, message: "Email ID required" });

    const user = await Admin.findOne({ emailID });
    if (user)
      return res.status(400).json({ code: 1, message: "Email ID already exist" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.create({ email: emailID, otp });

    console.log("OTP sent (simulation):", otp);

    return res.json({ code: 0, message: "OTP sent", otp });
  } catch (err) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});


// POST /auth/verify-email-otp
const verifyEmailOtp = asyncHandler(async (req, res) => {
  try {
    const { emailID, otp } = req.body;

    if (!emailID || !otp)
      return res.status(400).json({
        code: 1,
        message: "Email ID and OTP required",
      });

    const validOtp = await Otp.findOne({ email: emailID, otp });

    if (!validOtp)
      return res.status(400).json({
        code: 1,
        message: "Invalid or expired OTP",
      });

    await Otp.deleteMany({ email: emailID });

    return res.json({
      code: 0,
      message: "Login successful",
    });

  } catch (err) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});


// POST /auth/instructor-signup
const signupAdmin = asyncHandler(async (req, res) => {
  try {
    const adminData = req.body;
    console.log("req.body", req.body);

    const response = await Admin.create(adminData);
    
 
    
    return res.json({
      code: 0,
      message: "Instructor signed up successfully",
      instructor: response,
    });

  } catch (err) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});

const saveLoginCredentials = asyncHandler(async (req, res) => {
  try {
    const {userId,emailID,mobileNo,password,role} = req.body;
    console.log("userid",userId);
  const passwordHash = await bcrypt.hash(password, 10);
    const response = await AuthProvider.create({userId,emailID,mobileNo,passwordHash,role, authType:"mobile_password",lastLoginAt: new Date()});

    return res.json({
      code: 0,
      message: "login credentails saved successfully",
      instructor: response,
    });

  } catch (err) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});
const adminLogin  = asyncHandler(async (req, res) => {
  try {
    const { loginId, password } = req.body;

    // Find auth by either email or mobile number
    const auth = await AuthProvider.findOne({
      $or: [
      { emailID: loginId.toLowerCase().trim() },
        { mobileNo: loginId }
      ]
    });

    if (!auth) {
      return res.status(400).json({
        code: 1,
        message: "Invalid credentials",
      });
    }
//    console.log("password",password,"authpassword",auth.passwordHash);;
    // Verify password
    const match = await bcrypt.compare(password, auth.passwordHash);

    if (!match) {
      return res.status(400).json({
        code: 1,
        message: "Invalid credentials",
      });
    }

    // Find user and update last login
    let user={};
console.log("auth",auth);
 user = await Admin.findById(auth.userId);
    if (!user) {
      return res.status(400).json({
        code: 1,
        message: "User not found",
      });
    }

    auth.lastLoginAt = new Date();
    await auth.save();

    const token = sign({ id: user._id, role: auth.role });

    return res.json({ code: 0, token, user ,role:auth.role});
  } catch (err) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});


const updateAdmin = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
  
    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ code: 1, message: "admin not found" });
    Object.assign(admin, req.body);
    await admin.save();
    res.json({ code: 0, data: admin, message: "admin updated successfully" });
  } catch (error) {
    res.status(500).json({ code: 1, message: error.message });
  }
});


module.exports = {
  sendMobileOtp,
  verifyMobileOtp,
  sendEmailOtp,
  verifyEmailOtp,
  signupAdmin,
  saveLoginCredentials,
  adminLogin,
  updateAdmin
};
