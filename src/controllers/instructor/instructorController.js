const { Instructor } = require("../../models/models");
const asyncHandler = require("express-async-handler"); // Make sure to import this

const getInstructor = asyncHandler(async (req, res) => {
  try {
    const searchText = req.query.searchText?.trim() || "";
    const from = parseInt(req.query.from) || 0;
    const size = (parseInt(req.query.size) || 20); // Limit max size to 100
    
    // Validate numeric parameters
    if (from < 0 || size < 0) {
      return res.status(400).json({
        code: 1,
        message: "Invalid parameters: 'from' and 'size' must be non-negative numbers"
      });
    }

    // Build filter object
    const filter = {};
    
    // TODO: Uncomment and use actual authentication
    // const filter = { instructorId: req.user._id };

    // Search text filter
    if (searchText) {
      filter.$text = { $search: searchText };
    }

    // isDeleted filter - only apply if query param exists
    if (req.query.isDeleted !== undefined) {
      // Convert string to boolean, accept "true"/"false", "1"/"0"
      filter.isDeleted = req.query.isDeleted === "true";
    }

    // Status filter - only apply if query param exists and is valid
    if (req.query.status !== undefined && req.query.status.trim() !== "") {
      filter.status = req.query.status.trim();
    }

    // Total count
    const totalCount = await Instructor.countDocuments(filter);

    // Paginated data
    const instructors = await Instructor.find(filter)
      .skip(from)
      .limit(size)
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance if not modifying documents

    return res.json({
      code: 0,
      data: instructors,
      totalCount,
      message: "Instructors retrieved successfully"
    });

  } catch (error) {
     res.status(500).json({ code: 1, message: error.message });
      
  }
});

module.exports = {
  getInstructor
}; 