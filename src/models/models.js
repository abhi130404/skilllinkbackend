const mongoose = require("mongoose");
const { Schema } = mongoose;

/* ===========================
   USERS COLLECTION
=========================== */
const userSchema = new Schema(
  {
    role: { type: String, enum: ["learner", "instructor", "admin"], default: "learner" },
    name: { type: String }, // name not required for mobile login

     mobileNo: { type: String, unique: true, sparse: true },
    emailID: { 
      type: String, 
      unique: true, 
      sparse: true,
      set: function(email) {
        return email ? email.toLowerCase().trim() : email;
      }
    },
     isMobileNoVerified: { type: Boolean, default: false },
    isEmailIDVerified: { type: Boolean, default: false },
   // email: { type: String, unique: false, sparse: true},
    profileImage: String,
    isDeleted:{type:Boolean,default:false},

    // Updated as array of objects
    skills: [
      {
        name: { type: String },
        parentCode:{type:String},
        code: { type: String }
      }
    ],
    schoolName:{type:String},
     grade:{type:String},
    bio: String,

    // Updated as array of objects
    learningGoals: [
      {
        name: { type: String },
        code: { type: String }
      }
    ],

    expertise: [String],

    socialLinks: {
    },

    status: { type: String, enum: ["active", "inactive"], default: "active" }
  },
  { timestamps: true }
);
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String },     // optional
    isDeleted: { type: Boolean, default: false }, // active/inactive
  },
  { timestamps: true }
);

const subCategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    categoryName:{type:String},  
    image: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const topicSchema = new mongoose.Schema(
  {
    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    subCategoryName:{type:String},
    image: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);


const adminSchema = new Schema(
  {
    role: { type: String, enum: ["learner", "instructor", "admin"], default: "learner" },
    name: { type: String }, // name not required for mobile login

     mobileNo: { type: String, unique: true, sparse: true },
      emailID: { 
      type: String, 
      unique: true, 
      sparse: true,
      set: function(email) {
        return email ? email.toLowerCase().trim() : email;
      }
    },
     isMobileNoVerified: { type: Boolean, default: false },
    isEmailIDVerified: { type: Boolean, default: false },
   // email: { type: String, unique: false, sparse: true},
    profileImage: String,
    isDeleted:{type:Boolean,default:false},

    // Updated as array of objects
   

    socialLinks: {
    },
  },
  { timestamps: true }
);
const instructorSchema = new Schema(
  {
      rejectionReason:{type:String},
    role: { type: String, enum: ["learner", "instructor", "admin"], default: "instructor" },
    type: { type: String, enum: ["entity", "individual"], default: "individual" },
   category: { type: String, enum: ["","tutor", "classes","institute","eventOrganizer"], default: "" },
    name: { type: String },
    mobileNo: { type: String, unique: true, sparse: true },
      emailID: { 
      type: String, 
      unique: true, 
      sparse: true,
      set: function(email) {
        return email ? email.toLowerCase().trim() : email;
      }
    },

    isMobileNoVerified: { type: Boolean, default: false },
    isEmailIDVerified: { type: Boolean, default: false },

    instructorId: { type: String },
youtubeVideos:[],
    isKycCompleted:{type:Boolean,default:false},
    gstin: { type: String },
    pan: { type: String },
    adharNo: { type: String },
      socialLinks: {
    youtube: { type: String },
    linkedin: { type: String },
    instagram: { type: String },
    facebook:{ type: String },
    website:{type:String},
  },
  images:[],
 title:{type:String},
    status: {
      type: String,
      enum: ["initiated", "pendingApproval", "approved", "rejected"],
      default: "initiated",
    },

    accountNo: { type: String },
    ifscCode: { type: String },
    bankName: { type: String },

    cancelledChequeImgPath: { type: String },
    aadharFrontImgPath: { type: String },
    aadharBackImgPath: { type: String },
    panImgPath: { type: String },
    gstinFilePath: { type: String },

    address: {
      lineAddress: { type: String },
      lineAddress2: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      landmark: { type: String },
    },

    /** --------------------- NEW FIELDS ---------------------- **/
    profileImagePath: { type: String },

    experience: { type: Number, default: 0 }, // in years
    price: { type: Number, default: 0 }, // per hour

    gender: { type: String, },

    bio: { type: String },

    specialties: [
      {
        name: String,
        code: String,
        parentCode: String,
      }
    ],

    availability: {
      type: Object, // { Monday: [{from, to}], Tuesday:[...] }
      default: {}
    },
contactPersonName:{type:String},


  },
  { timestamps: true }
);
/* ===========================
   AUTH PROVIDERS COLLECTION
=========================== */
const authProviderSchema = new Schema(
  {
    userId: { type:String, required: true },
   role: { type: String, enum: ["learner", "instructor", "admin"], default: "learner" },
    authType: {
      type: String,
      enum: ["mobile_password", "google", "meta", "email_password"],
      required: true
    },
     emailID: { 
      type: String, 
      unique: true, 
      sparse: true,
      set: function(email) {
        return email ? email.toLowerCase().trim() : email;
      }
    },
   mobileNo: { type: String },
    passwordHash:  { type: String }, // only for email-password login
    googleId:  { type: String },
    metaId:  { type: String },
    lastLoginAt: Date
  },
  { timestamps: true }
);

/* ===========================
   OTPS COLLECTION
=========================== */
const otpSchema = new Schema(
  {
    mobile: { type: String, default: null },
    email: { type: String, default: null },

    otp: { type: String, required: true },

    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60, // delete after 1 minute
    },
  },
  { timestamps: true }
);


/* ===========================
   LISTINGS COLLECTION
=========================== */
const listingSchema = new Schema(
  {
    instructorId:{type:String},
    title:{type:String},
    type: { type: String },
    typeId: { type: String },
    categories: [],
    subCategories: [],
    description: { type: String },
    participantfee:{type:Number},
    seatCapacity:{type:Number},
    topics:[],
    address: {
      lineAddress1: { type: String },
      lineAddress2: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      landMark: { type: String },
      lat: { type: String },
      lon: { type: String }
    },
    images: [{ type: String }], // Changed to array of strings
    facebookUrl: { type: String },
    instagramUrl: { type: String },
    linkedInUrl: { type: String },
    locationType: { type: String, enum: ["online", "specificLocation"], default: "online" },
    frequency: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    timeSlots: [{
      startTime: { type: String },
      endTime: { type: String }
    }],
    isDeleted:{type:Boolean},
    days: {
      sunday: { type: Boolean, default: false },
      monday: { type: Boolean, default: false },
      tuesday: { type: Boolean, default: false },
      wednesday: { type: Boolean, default: false },
      thursday: { type: Boolean, default: false },
      friday: { type: Boolean, default: false },
      saturday: { type: Boolean, default: false }
    },
    youtubeVideos: [{
      videoUrl: { type: String },
      description: { type: String }
    }],
    instructions: [{
      title: { type: String },
      description: { type: String }
    }],
    faqs: [{
      question: { type: String },
      answer: { type: String }
    }],
      participantCount: { type: Number, default: 0 }, // NEW FIELD
          earning: { type: Number, default: 0 }, // NEW FIELD
    status: { type: String, enum:["draft", "pendingApproval", "approved", "rejected"], default: "draft" },
    rejectionReason:{type:String}
  },
  { timestamps: true }
);

listingSchema.index({
  title: "text",
  description: "text",
  category: "text",
  subCategory: "text"
});

/* ===========================
   ENROLLMENTS COLLECTION
=========================== */
const enrollmentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    instructorId:{type: Schema.Types.ObjectId, ref: "Instructor", required: true},
    seatNumber: { type: Number },

    selectedSlot: {
      startTime: String,
      endTime: String,
    },
    selectedDate:{type:String},

    // NEW FIELDS
    status: { type: String, enum: ["pending", "active", "completed"], default: "pending" },
    isArchived: { type: Boolean, default: false },  // ready for deletion later

    progress: { type: Number, default: 0 },
    completedModules: [String],
    certificateIssued: { type: Boolean, default: false },
    
    enrolledAt: { type: Date, default: Date.now },
    lastAccessedAt: Date
  },
  { timestamps: true }
);


/* ===========================
   MESSAGES COLLECTION
=========================== */
const messageSchema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: String,
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

/* ===========================
   DISCUSSIONS COLLECTION
=========================== */
const discussionSchema = new Schema(
  {
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: String,
    parentId: { type: Schema.Types.ObjectId, ref: "Discussion" } // For threaded replies
  },
  { timestamps: true }
);

/* ===========================
   PAYMENTS COLLECTION
=========================== */
const paymentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listingId: { type: Schema.Types.ObjectId, ref: "Listing" },
    paymentType: { type: String, enum: ["subscription", "one_time"], required: true },
    amount: Number,
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    gateway: { type: String, enum: ["razorpay", "stripe", "stub"] },
    transactionId: String
  },
  { timestamps: true }
);

/* ===========================
   CERTIFICATES COLLECTION
=========================== */
const certificateSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    certificateUrl: String,
    issuedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

/* ===========================
   REVIEWS COLLECTION
=========================== */
const reviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    rating: { type: Number, min: 1, max: 5 },
    review: String
  },
  { timestamps: true }
);


const auditTrailSchema = new Schema(
  {
    collectionName: { type: String, required: true }, // "Listing"
    documentId: { type: Schema.Types.ObjectId, required: true }, // The listing ID
    action: { 
      type: String, 
      enum: ["create", "update", "delete", "status_change", "restore"],
      required: true 
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Who performed the action
    userRole: { type: String, enum: ["learner", "instructor", "admin"], required: true },
    userName: { type: String }, // Store username for quick reference
    previousData: { type: Schema.Types.Mixed }, // Snapshot before change
    newData: { type: Schema.Types.Mixed }, // Snapshot after change
    changedFields: [String], // Which fields were modified
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index for efficient querying
auditTrailSchema.index({ collectionName: 1, documentId: 1 });
auditTrailSchema.index({ userId: 1 });
auditTrailSchema.index({ timestamp: -1 });

/* ===========================
   MODEL EXPORTS
=========================== */
const User = mongoose.model("User", userSchema);
const Instructor = mongoose.model("Instructor", instructorSchema);
const AuthProvider = mongoose.model("AuthProvider", authProviderSchema);
const Otp = mongoose.model("Otp", otpSchema);
const Listing = mongoose.model("Listing", listingSchema);
const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
const Message = mongoose.model("Message", messageSchema);
const Discussion = mongoose.model("Discussion", discussionSchema);
const Payment = mongoose.model("Payment", paymentSchema);
const Certificate = mongoose.model("Certificate", certificateSchema);
const Review = mongoose.model("Review", reviewSchema);
const Admin = mongoose.model("Admin", adminSchema);
const AuditTrail = mongoose.model("AuditTrail", auditTrailSchema);
const Category =mongoose.model("Category",categorySchema);
const SubCategory =mongoose.model("SubCategory",subCategorySchema);
const Topic =mongoose.model("Topic",topicSchema);
// async function addAdmin() {
//   try {
//     const admin = new Admin({
//       name: "admin test",
//       role: "admin",
//       mobileNo: "1234567890",
//       emailID: "admin@gmail.com",
//       isMobileNoVerified: true,
//       isEmailIDVerified: true,
//       profileImage: "",
//       isDeleted: false
//     });

//     const result = await admin.save(); // saves to MongoDB
//     console.log("Admin added:", result);
//   } catch (err) {
//     console.error("Error adding admin:", err);
//   }
// }

// // Call the function
// addAdmin();

// async function insertAdminAuth() {
//   try {
//     const passwordHash = await bcrypt.hash("123456", 10);

//     const adminAuth = await AuthProvider.create({
//       userId: "admin123",           // unique id for admin
//       emailID: "admin@gmail.com",
//       mobileNo: "1234567890",
//       passwordHash,
//       role: "admin",
//       authType: "mobile_password",
//       lastLoginAt: new Date()
//     });

//     console.log("Admin inserted into AuthProvider:", adminAuth);
//     process.exit(0); // exit after done
//   } catch (err) {
//     console.error("Error inserting admin:", err);
//     process.exit(1);
//   }
// }
// insertAdminAuth();

module.exports = {
  User,
  Instructor,
  AuthProvider,
  Otp,
  Listing,
  Enrollment,
  Message,
  Discussion,
  Payment,
  Certificate,
  Review,
  AuditTrail,
  Admin,
  Category,
  SubCategory,
  Topic
};
