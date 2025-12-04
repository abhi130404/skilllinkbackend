const asyncHandler = require("express-async-handler");
const { Enrollment, Listing, User } = require("../models/models");

const enroll = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id; // <-- GET USER ID FROM TOKEN
    const { listingId, selectedDate, selectedSlot,instructorId } = req.body;

    if (!listingId) {
      return res.status(400).json({code:1, message: "listingId required" });
    }

    if (!selectedDate) {
      return res.status(400).json({code:1, message: "selectedDate required" });
    }

    if (!selectedSlot || !selectedSlot.startTime || !selectedSlot.endTime) {
      return res.status(400).json({code:1, message: "selectedSlot startTime & endTime required" });
    }

    // 1. Check user already enrolled
  const existing = await Enrollment.findOne({
  userId,
  listingId,
  selectedDate,
  selectedSlot,
});

if (existing) {
  return res.status(400).json({
    code:1,
    message: "You have already booked this time slot."
  });
}

    // 2. Check listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ code:1,message: "Listing not found" });
    }

    // 3. Seat capacity validation
    if (
      listing.locationType !== "online" &&
      listing.seatCapacity != null &&
      listing.participantCount >= listing.seatCapacity
    ) {
      return res.status(400).json({code:1, message: "No more seats are available for this session." });
    }

    // 4. Create enrollment
    const enrollment = await Enrollment.create({
      userId,
      listingId,
      selectedDate,
      selectedSlot: {
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime
      },
      seatNumber:
        listing.locationType !== "online"
          ? listing.participantCount + 1
          : null,
          instructorId:instructorId
    });

    // 5. Increase participant count
    await Listing.findByIdAndUpdate(listingId, {
      $inc: { participantCount: 1 }
    });

    res.status(201).json({
      code: 0,
      message: "Registered successfully",
      enrollment
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({code:1, message: "Server error", error });
  }
});


// const getEnrollments = asyncHandler(async (req, res) => {
//   try {
//     const enrollments = await Enrollment.find({ userId: req.user._id })
//       .populate("listingId");

//     res.json(enrollments);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// });

const getEnrollments = asyncHandler(async (req, res) => {
  try {
    const searchText = req.query.searchText || "";
    const from = parseInt(req.query.from || "0");
    const size = parseInt(req.query.size || "20");
    const instructorId = req.query.instructorId || "";
    const userId = req.query.userId || "";
   console.log("comming here");
    // Build filter object
    const filter = {};

    // Handle instructorId and userId filters
    console.log("instructorId",instructorId);
    if (instructorId) {
      filter.instructorId = instructorId;
    } 
    if (userId) {
      filter.userId = userId;
    }

    // Search text filter
    if (searchText) {
      filter.$text = { $search: searchText };
    }

    // isDeleted filter → only apply if query param exists
    // if (req.query.isDeleted !== undefined) {
    //   filter.isDeleted = req.query.isDeleted;
    // }

    // Total count
    const totalCount = await Enrollment.countDocuments(filter);

    // Paginated data
    const enrollments = await Enrollment.find(filter)
      .skip(from)
      .limit(size)
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance since we'll modify the data

    // Collect all unique userIds and listingIds
    const userIds = [...new Set(enrollments.map(enrollment => enrollment.userId))];
    const listingIds = [...new Set(enrollments.map(enrollment => enrollment.listingId))];

    // Fetch users and listings in parallel
    const [users, listings] = await Promise.all([
      User.find({ _id: { $in: userIds } }).lean(),
      Listing.find({ _id: { $in: listingIds } }).lean()
    ]);

    // Create lookup maps for quick access
    const userMap = users.reduce((map, user) => {
      map[user._id.toString()] = user;
      return map;
    }, {});

    const listingMap = listings.reduce((map, listing) => {
      map[listing._id.toString()] = listing;
      return map;
    }, {});

    // Enrich enrollments with user and listing objects
    const enrichedEnrollments = enrollments.map(enrollment => ({
      ...enrollment,
      user: userMap[enrollment.userId?.toString()] || null,
      listing: listingMap[enrollment.listingId?.toString()] || null
    }));

    return res.json({
      code: 0,
      data: enrichedEnrollments,
      totalCount,
      message: "enrollments retrieved successfully"
    });

  } catch (error) {
    return res.status(500).json({ code: 1, message: error.message });
  }
});
const getParticipants = asyncHandler(async (req, res) => {
  try {
    const instructorId = req.query.instructorId;
    const from = parseInt(req.query.from || "0");
    const size = parseInt(req.query.size || "20");

    if (!instructorId) {
      return res.status(400).json({ 
        code: 1, 
        message: "instructorId is required" 
      });
    }

    // Get enrolled user IDs first
    const enrolledUserIds = await Enrollment.distinct('userId', {
      instructorId: instructorId,
      userId: { $exists: true, $ne: null }
    });

    // Get users based on those IDs
    const users = await User.find({
      _id: { $in: enrolledUserIds }
    })
    .select('-password') // Exclude password
    .skip(from)
    .limit(size);

    return res.json({
      code: 0,
      data: users,
      totalCount: enrolledUserIds.length,
      message: "Unique participants retrieved successfully"
    });

  } catch (error) {
    return res.status(500).json({ code: 1, message: error.message });
  }
});
const updateProgress = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params; 
    const { progress, completedModules } = req.body;

    const enrollment = await Enrollment.findById(id);

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    if (!enrollment.userId.equals(req.user._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (progress !== undefined) enrollment.progress = progress;
    if (completedModules) enrollment.completedModules = completedModules;

    enrollment.lastAccessedAt = new Date();
    await enrollment.save();

    res.json(enrollment);

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});
const cancelEnrollment = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params; // enrollment ID

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Only allow user to cancel their own enrollment
    if (!enrollment.userId.equals(req.user._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // Decrease participant count from listing
    await Listing.findByIdAndUpdate(enrollment.listingId, {
      $inc: { participantCount: -1 }
    });

    await Enrollment.findByIdAndDelete(id);

    res.json({ message: "Enrollment cancelled successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", error });
  }
});
const getParticipantEnrollments = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.userId;
    const searchText = req.query.searchText || "";
    const from = parseInt(req.query.from || "0");
    const size = parseInt(req.query.size || "20");
    
    // Validate userId
    if (!userId) {
      return res.status(400).json({ 
        code: 1, 
        message: "User ID is required" 
      });
    }

    // Verify user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ 
        code: 1, 
        message: "User not found" 
      });
    }

    // Build filter object with userId
    const filter = { userId };

    // Search text filter (searches in listing titles, descriptions, etc.)
    if (searchText) {
      filter.$text = { $search: searchText };
    }

    // Total count for pagination
    const totalCount = await Enrollment.countDocuments(filter);

    // Get counts by status
    const totalActiveCount = await Enrollment.countDocuments({ 
      ...filter, 
      status: 'active' 
    });
    
    const totalCompletedCount = await Enrollment.countDocuments({ 
      ...filter, 
      status: 'completed' 
    });
    
    const totalPendingCount = await Enrollment.countDocuments({ 
      ...filter, 
      status: 'pending' 
    });

    // Fetch enrollments with pagination
    const enrollments = await Enrollment.find(filter)
      .skip(from)
      .limit(size)
      .sort({ createdAt: -1 })
      .lean();

    // If no enrollments found, return empty array with counts
    if (enrollments.length === 0) {
      return res.json({
        code: 0,
        data: [],
        totalCount: 0,
        totalActiveCount: 0,
        totalCompletedCount: 0,
        totalPendingCount: 0,
        message: "No enrollments found for this user"
      });
    }

    // Collect all unique listingIds from enrollments
    const listingIds = [...new Set(enrollments.map(enrollment => enrollment.listingId))];

    // Fetch listings with their instructors
    const listings = await Listing.find({ _id: { $in: listingIds } })
      .populate('instructorId', 'name email profilePicture') // Populate instructor details
      .lean();

    // Create lookup map for listings
    const listingMap = listings.reduce((map, listing) => {
      map[listing._id.toString()] = listing;
      return map;
    }, {});

    // Enrich enrollments with listing objects (including instructor info)
    const enrichedEnrollments = enrollments.map(enrollment => ({
      ...enrollment,
      listing: listingMap[enrollment.listingId?.toString()] || null
    }));

    return res.json({
      code: 0,
      data: enrichedEnrollments,
      totalCount,
      totalActiveCount,
      totalCompletedCount,
      totalPendingCount,
      message: "User enrollments retrieved successfully"
    });

  } catch (error) {
    console.error("Error fetching user enrollments:", error);
    return res.status(500).json({ 
      code: 1, 
      message: error.message 
    });
  }
});
module.exports = { enroll, getEnrollments, updateProgress,cancelEnrollment ,getParticipantEnrollments,getParticipants};
