const asyncHandler = require("express-async-handler");
const { Otp, User, AuthProvider, Instructor } = require("../../models/models");
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

    const user = await Instructor.findOne({ mobileNo });
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

    const user = await Instructor.findOne({ emailID });
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
const signupInstructor = asyncHandler(async (req, res) => {
  try {
    const instructorData = req.body;
    console.log("req.body", req.body);

    const response = await Instructor.create(instructorData);
    
    // Update the document to add instructorId
    const updatedInstructor = await Instructor.findByIdAndUpdate(
      response._id,
      { instructorId: response._id },
      { new: true } // Return updated document
    );
    
    return res.json({
      code: 0,
      message: "Instructor signed up successfully",
      instructor: updatedInstructor,
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
const instructorLogin  = asyncHandler(async (req, res) => {
  try {
    const { loginId, password } = req.body;

    // Find auth by either email or mobile number
    console.log("loginId",loginId.toLowerCase());
    const auth = await AuthProvider.findOne({
      $or: [
        { emailID: loginId.toLowerCase() },
        { mobileNo: loginId }
      ]
    });

    if (!auth) {
      return res.status(400).json({
        code: 1,
        message: "Invalid credentials",
      });
    }
   console.log("password",password,"authpassword",auth.passwordHash);;
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

 user = await Instructor.findById(auth.userId);
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


const updateInstructor = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { emailID, mobileNo } = req.body;

    // 1. FIND INSTRUCTOR
    const instructor = await Instructor.findById(id);
    if (!instructor)
      return res.status(404).json({ code: 1, message: "Instructor not found" });

    // -------------------------------
    // 2. UNIQUE CHECK: EMAIL-ID
    // -------------------------------

    if (emailID) {
      // Check in Instructor table
      const existingInstructorEmail = await Instructor.findOne({
        emailID,
        _id: { $ne: id },
      });

      if (existingInstructorEmail) {
        return res.status(400).json({
          code: 1,
          message: "Email ID already exists in Instructor",
        });
      }

      // Check in AuthProvider table
      const existingAuthEmail = await AuthProvider.findOne({
        emailID,
        userId: { $ne: id },
      });

      if (existingAuthEmail) {
        return res.status(400).json({
          code: 1,
          message: "Email ID already exists in AuthProvider",
        });
      }
    }

    // -------------------------------
    // 3. UNIQUE CHECK: MOBILE-NO
    // -------------------------------

    if (mobileNo) {
      // Check in Instructor table
      const existingInstructorMobile = await Instructor.findOne({
        mobileNo,
        _id: { $ne: id },
      });

      if (existingInstructorMobile) {
        return res.status(400).json({
          code: 1,
          message: "Mobile number already exists in Instructor",
        });
      }

      // Check in AuthProvider table
      const existingAuthMobile = await AuthProvider.findOne({
        mobileNo,
        userId: { $ne: id },
      });

      if (existingAuthMobile) {
        return res.status(400).json({
          code: 1,
          message: "Mobile number already exists in AuthProvider",
        });
      }
    }

    // -------------------------------
    // 4. UPDATE INSTRUCTOR
    // -------------------------------
    Object.assign(instructor, req.body);
    await instructor.save();

    // -------------------------------
    // 5. UPDATE AUTH PROVIDER
    // -------------------------------
    const auth = await AuthProvider.findOne({ userId: id });

    if (auth) {
      if (emailID) auth.emailID = emailID;
      if (mobileNo) auth.mobileNo = mobileNo;
      await auth.save();
    }

    // -------------------------------
    // 6. RESPONSE
    // -------------------------------
    res.json({
      code: 0,
      data: instructor,
      message: "Instructor updated successfully",
    });
  } catch (error) {
    res.status(500).json({ code: 1, message: error.message });
  }
});



module.exports = {
  sendMobileOtp,
  verifyMobileOtp,
  sendEmailOtp,
  verifyEmailOtp,
  signupInstructor,
  saveLoginCredentials,
  instructorLogin,
  updateInstructor
};
