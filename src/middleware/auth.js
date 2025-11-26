const asyncHandler = require("express-async-handler");
const { verify } = require("../utils/jwt");
const { User, Instructor } = require("../models/models");

const protect = asyncHandler(async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ message: "Not authorized" });
    return;
  }
  const token = auth.split(" ")[1];
  try {
    const decoded = verify(token);
    
    // Try to find user in User model first
    let user = await User.findById(decoded.id);
    
    // If not found in User model, try Instructor model
    if (!user) {
      user = await Instructor.findById(decoded.id);
    }
    
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }
    
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});

module.exports = { protect };