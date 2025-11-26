const { User } = require("../models/models");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ code: 1, message: "User not found" });
    }

    return res.json({ code: 0, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 1, message: "Server error", error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
  
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ code: 1, message: "user not found" });
    Object.assign(user, req.body);
    await user.save();
    res.json({ code: 0, data: user, message: "user updated successfully" });
  } catch (error) {
    res.status(500).json({ code: 1, message: error.message });
  }
};



module.exports = { getProfile, updateProfile };
