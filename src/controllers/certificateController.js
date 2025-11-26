const asyncHandler = require("express-async-handler");
const { Certificate, Enrollment } = require("../models/models");

const issueCertificate = asyncHandler(async (req, res) => {
  const { listingId, userId, certificateUrl } = req.body;
  if (!listingId || !userId || !certificateUrl) return res.status(400).json({ message: "missing fields" });

  // Basic check: user must be enrolled and have sufficient progress
  const enrollment = await Enrollment.findOne({ userId, listingId });
  if (!enrollment) return res.status(400).json({ message: "User not enrolled" });
  if (enrollment.progress < 90) return res.status(400).json({ message: "Progress too low to issue certificate" });

  const cert = await Certificate.create({ userId, listingId, certificateUrl, issuedAt: new Date() });
  enrollment.certificateIssued = true;
  await enrollment.save();
  res.json(cert);
});

module.exports = { issueCertificate };
