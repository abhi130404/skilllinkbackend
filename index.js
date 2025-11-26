require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");


const authRoutes = require("./src/routes/auth");
const userRoutes = require("./src/routes/users");
const listingRoutes = require("./src/routes/listings");
const enrollmentRoutes = require("./src/routes/enrollments");
const messageRoutes = require("./src/routes/messages");
const discussionRoutes = require("./src/routes/discussions");
const paymentRoutes = require("./src/routes/payments");
const reviewRoutes = require("./src/routes/reviews");
const certificateRoutes = require("./src/routes/certificates");
const instructorAuthRoutes = require("./src/routes/instructor/auth");
const fileUploadRoutes=require("./src/routes/fileUpload");
const auditTrailRoutes = require("./src/routes/auditTrail");
const connectDB = require("./src/config/db/mongodb");

const app = express();
connectDB();

app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/v1/auth", authRoutes);
app.use("/v1/users", userRoutes);
app.use("/v1/listings", listingRoutes);
app.use("/v1/enrollments", enrollmentRoutes);
app.use("/v1/messages", messageRoutes);
app.use("/v1/discussions", discussionRoutes);
app.use("/v1/payments", paymentRoutes);
app.use("/v1/reviews", reviewRoutes);
app.use("/v1/certificates", certificateRoutes);
app.use("/v1/instructor/auth",instructorAuthRoutes);
app.use("/v1/fileupload",fileUploadRoutes);
app.use("/v1/audittrail",auditTrailRoutes);
app.use("/v1/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/v1", (req, res) => res.json({ ok: true, message: "SkillLink API running" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
