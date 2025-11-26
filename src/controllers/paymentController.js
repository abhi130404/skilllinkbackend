const asyncHandler = require("express-async-handler");
const { Payment } = require("../models/models");

/**
 * createPaymentIntent - stub
 * body: { userId, listingId, amount, paymentType }
 * In production, integrate Razorpay / Stripe SDK here and return client secret / order id
 */
const createPaymentIntent = asyncHandler(async (req, res) => {
  const { listingId, amount, paymentType = "one_time" } = req.body;
  if (!amount) return res.status(400).json({ message: "amount required" });

  // create stub payment record
  const payment = await Payment.create({
    userId: req.user._id,
    listingId,
    amount,
    paymentType,
    gateway: "stub",
    status: "pending",
    transactionId: `stub_${Date.now()}`
  });

  // Return a "clientPayload" to simulate client-side flow
  res.json({ payment, clientPayload: { stub: true, transactionId: payment.transactionId } });
});

/**
 * confirmPayment - stub endpoint to mark success
 * body: { paymentId, status }
 */
const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentId, status } = req.body;
  const payment = await Payment.findById(paymentId);
  if (!payment) return res.status(404).json({ message: "Payment not found" });

  payment.status = status === "success" ? "success" : "failed";
  await payment.save();
  res.json(payment);
});

module.exports = { createPaymentIntent, confirmPayment };
