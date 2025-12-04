const asyncHandler = require("express-async-handler");
const { Otp, User, AuthProvider, Instructor } = require("../models/models");
const { sign } = require("../utils/jwt");
const bcrypt = require("bcrypt");
const axios = require("axios");

/**
 * sendOtp - store OTP (simulate sending)
 * body: { mobile }
 */
// POST /auth/send-otp
const sendMobileOtp = asyncHandler(async (req, res) => {
  try {
    const { mobileNo } = req.body;
    console.log("mobileno", mobileNo);

    if (!mobileNo)
      return res.status(400).json({ code: 1, message: "Mobile number required" });

    const user = await User.findOne({ mobileNo });
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

    const user = await User.findOne({ emailID });
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

/**
 * registerUser
 */
const registerUser = asyncHandler(async (req, res) => {
  try {
    const userData = req.body;
    console.log("req.body", req.body);

    const response = await User.create(userData);
 

    const token = sign({ id: response._id, role: response.role });
    
    return res.json({
      code: 0,
      message: "user signed up successfully",
      user: response,
      token:token
    });

  } catch (err) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});
// const registerUser = asyncHandler(async (req, res) => {
//   try {
//     const { name, phoneNo, password, role } = req.body;
//     console.log("req.body", req.body);

//     if (!phoneNo || !name)
//       return res.status(400).json({
//         code: 1,
//         message: "please enter all fields !",
//       });

//     const existing = await AuthProvider.findOne({
//       authType: "phoneNo",
//       phoneNo,
//     });

//     if (existing)
//       return res.status(400).json({
//         code: 1,
//         message: "Phone no already in use",
//       });

//     const passwordHash = await bcrypt.hash(password, 10);
//     const user = await User.create({
//       name,
//       phoneNo,
//       role: role || "learner",
//     });

//     await AuthProvider.create({
//       userId: user._id,
//       authType: "phoneNo",
//       phoneNo,
//       passwordHash,
//     });

//     const token = sign({ id: user._id, role: user.role });

//     return res.json({ code: 0, token, user });
//   } catch (err) {
//     return res.status(500).json({ code: 1, message: err.message });
//   }
// });

/**
 * loginEmail
 */
const userLogin  = asyncHandler(async (req, res) => {
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

 user = await User.findById(auth.userId);
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

const saveLoginCredentials = asyncHandler(async (req, res) => {
  try {
    const {userId,emailID,mobileNo,password,role} = req.body;
    console.log("userid",userId);
  const passwordHash = await bcrypt.hash(password, 10);
    const response = await AuthProvider.create({userId,emailID,mobileNo,passwordHash,role, authType:"mobile_password",lastLoginAt: new Date()});

    return res.json({
      code: 0,
      message: "login credentails saved successfully",
      user: response,
    });

  } catch (err) {
      console.log("error",error);
    return res.status(500).json({ code: 1, message: err.message });
  }
});


/**
 * oauthLogin
 */
const oauthLogin = asyncHandler(async (req, res) => {
  try {
    const { provider, token } = req.body;

    if (!provider || !token)
      return res.status(400).json({
        code: 1,
        message: "provider and token required",
      });

    let profile;
    if (provider === "google") {
      profile = { email: `${token}@google`, name: `GoogleUser` };
    } else if (provider === "meta") {
      profile = { email: `${token}@meta`, name: `MetaUser` };
    } else {
      return res.status(400).json({
        code: 1,
        message: "Unsupported provider",
      });
    }

    let user = await User.findOne({ email: profile.email });

    if (!user) {
      user = await User.create({
        name: profile.name || "OAuthUser",
        email: profile.email,
        role: "learner",
      });
    }

    const authType = provider === "google" ? "google" : "meta";

    const query = { userId: user._id, authType };
    const update = {
      userId: user._id,
      authType,
      email: user.email,
      lastLoginAt: new Date(),
      googleId:
        provider === "google"
          ? profile.sub || profile.id || token
          : undefined,
      metaId: provider === "meta" ? profile.id || token : undefined,
    };

    await AuthProvider.findOneAndUpdate(query, update, {
      upsert: true,
      new: true,
    });

    const jwtToken = sign({ id: user._id, role: user.role });

    return res.json({ code: 0, token: jwtToken, user });
  } catch (err) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});

module.exports = {
  sendMobileOtp,
  verifyMobileOtp,
  sendEmailOtp,
  verifyEmailOtp,
  registerUser,
  userLogin,
  oauthLogin,
  saveLoginCredentials
};
