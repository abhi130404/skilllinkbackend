const asyncHandler = require("express-async-handler");
const { Listing, User } = require("../models/models");
const slugify = require("slugify");
const AuditTrailService = require("../services/AuditTrailService");


const createListing = asyncHandler(async (req, res) => {
  try {
    const data = req.body;
    
    // Validate required fields
    if (!data.title || !data.description) {
      return res.status(400).json({ 
        code: 1, 
        message: "Title and description are required" 
      });
    }

    // Set instructor ID from authenticated user
    data.instructorId = req.user._id;

    const listing = await Listing.create(data);
    
    // Log audit trail
    await AuditTrailService.logAction({
      collectionName: "Listing",
      documentId: listing._id,
      action: "create",
      userId: req.user._id,
      userRole: req.user.role,
      userName: req.user.name || req.user.emailID || req.user.mobileNo,
      newData: listing.toObject(),
      changedFields: Object.keys(data),
      req
    });

    res.status(201).json({ 
      code: 0, 
      data: listing, 
      message: "Listing created successfully" 
    });
  } catch (error) {
    console.error("Create listing error:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        code: 1, 
        message: "Validation error", 
        errors: Object.values(error.errors).map(err => err.message) 
      });
    }
    
    res.status(500).json({ 
      code: 1, 
      message: "Internal server error" 
    });
  }
});

const updateListing = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
  

    const listing = await Listing.findById(id);
    
    if (!listing) {
      return res.status(404).json({ 
        code: 1, 
        message: "Listing not found" 
      });
    }

    // Check ownership/authorization
  

    // Check if listing is deleted
    if (listing.isDeleted) {
      return res.status(410).json({ 
        code: 1, 
        message: "Cannot update a deleted listing" 
      });
    }

    const previousData = listing.toObject();
    const data = req.body;
    
    // Prevent instructor ID change via update
    // if (data.instructorId && data.instructorId !== req.user._id.toString()) {
    //   return res.status(403).json({ 
    //     code: 1, 
    //     message: "Cannot change listing ownership" 
    //   });
    // }

    // Detect changed fields
    const changedFields = [];
    Object.keys(data).forEach(key => {
      if (JSON.stringify(listing[key]) !== JSON.stringify(data[key])) {
        changedFields.push(key);
      }
    });

    // If no fields changed, return early
    if (changedFields.length === 0) {
      return res.json({ 
        code: 0, 
        data: listing, 
        message: "No changes detected" 
      });
    }

    Object.assign(listing, data);
    await listing.save();

    // Log audit trail
    await AuditTrailService.logAction({
      collectionName: "Listing",
      documentId: listing._id,
      action: "update",
      userId: req.user._id,
      userRole: req.user.role,
      userName: req.user.name || req.user.emailID || req.user.mobileNo,
      previousData,
      newData: listing.toObject(),
      changedFields,
      req
    });

    res.json({ 
      code: 0, 
      data: listing, 
      message: "Listing updated successfully" 
    });
  } catch (error) {
    console.error("Update listing error:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        code: 1, 
        message: "Validation error", 
        errors: Object.values(error.errors).map(err => err.message) 
      });
    }
    
    res.status(500).json({ 
      code: 1, 
      message: "Internal server error" 
    });
  }
});

const deleteListing = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        code: 1, 
        message: "Invalid listing ID format" 
      });
    }

    const listing = await Listing.findById(id);
    
    if (!listing) {
      return res.status(404).json({ 
        code: 1, 
        message: "Listing not found" 
      });
    }

    // Check ownership/authorization
    if (listing.instructorId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ 
        code: 1, 
        message: "Not authorized to delete this listing" 
      });
    }

    // Check if already deleted
    if (listing.isDeleted) {
      return res.status(410).json({ 
        code: 1, 
        message: "Listing already deleted" 
      });
    }

    const previousData = listing.toObject();
    
    listing.isDeleted = true;
    listing.deletedAt = new Date();
    await listing.save();

    // Log audit trail
    await AuditTrailService.logAction({
      collectionName: "Listing",
      documentId: listing._id,
      action: "delete",
      userId: req.user._id,
      userRole: req.user.role,
      userName: req.user.name || req.user.emailID || req.user.mobileNo,
      previousData,
      newData: listing.toObject(),
      changedFields: ["isDeleted", "deletedAt"],
      req
    });

    res.json({ 
      code: 0, 
      message: "Listing deleted successfully" 
    });
  } catch (error) {
    console.error("Delete listing error:", error);
    res.status(500).json({ 
      code: 1, 
      message: "Internal server error" 
    });
  }
});


// const updateListing = asyncHandler(async (req, res) => {
//   try {
//     const { id } = req.params;
  
//     const listing = await Listing.findById(id);
//     if (!listing) return res.status(404).json({ code: 1, message: "Listing not found" });
//     console.log("listing.instructorID",listing?.instructorId);

//         const  data = req.body;
//     data.instructorId=req.user._id;
//     Object.assign(listing, req.body);
//     await listing.save();
//     res.json({ code: 0, data: listing, message: "Listing updated successfully" });
//   } catch (error) {
//     res.status(500).json({ code: 1, message: error.message });
//   }
// });



// const deleteListing = asyncHandler(async (req, res) => {
//   try {
//     const { id } = req.params;
//     const listing = await Listing.findById(id);
//     if (!listing) return res.status(404).json({ code: 1, message: "Listing not found" });
    
//     // Check ownership/authorization (uncomment if needed)
//     // if (!listing.instructorId.equals(req.user._id) && req.user.role !== "admin")
//     //   return res.status(403).json({ code: 1, message: "Not allowed" });

//     // Update isDeleted to true instead of deleting
//     listing.instructorId=req.user._id;
//     listing.isDeleted = true;
//     await listing.save();

//     res.json({ code: 0, message: "Listing deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ code: 1, message: error.message });
//   }
// });
const getListing = asyncHandler(async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate("instructorId", "name profileImage");
    if (!listing) return res.status(404).json({ code: 1, message: "Listing not found" });
    res.json({ code: 0, data: listing, message: "Listing retrieved successfully" });
  } catch (error) {
    res.status(500).json({ code: 1, message: error.message });
  }
});

const getAllListingForInstructor = asyncHandler(async (req, res) => {
  try {
    const searchText = req.query.searchText || "";
    const from = parseInt(req.query.from || "0");
    const size = parseInt(req.query.size || "20");



    // Build filter object - always filter by instructorId
    const filter = { instructorId: req.user._id };

    // Search text filter
    if (searchText) {
      filter.$text = { $search: searchText };
    }

    // isDeleted filter → only apply if query param exists
    if (req.query.isDeleted !== undefined) {
      filter.isDeleted = req.query.isDeleted === "true"; 
      // converts "true"/"false" to boolean
    }

    // Total count
    const totalCount = await Listing.countDocuments(filter);

    // Paginated data
    const listings = await Listing.find(filter)
      .skip(from)
      .limit(size)
      .sort({ createdAt: -1 });

    return res.json({
      code: 0,
      data: listings,
      totalCount,
      message: "Listings retrieved successfully"
    });

  } catch (error) {
    return res.status(500).json({ code: 1, message: error.message });
  }
});

const getAllListingForUser = asyncHandler(async (req, res) => {
  try {
    const searchText = req.query.searchText || "";
    const from = parseInt(req.query.from || "0");
    const size = parseInt(req.query.size || "20");
    const listingTypeId=req.query.listingTypeId || "";
  const status=req.query.status || "";

    const filter={};

    // Search text filter
    if (searchText) {
      filter.$text = { $search: searchText };
    }
    if (listingTypeId) {
      filter.typeId = listingTypeId;
    }
    // isDeleted filter → only apply if query param exists
    if (req.query.isDeleted !== undefined) {
      filter.isDeleted = req.query.isDeleted === "true"; 
      // converts "true"/"false" to boolean
    }
   if (status !== "") {
      filter.status = status; 
    }
    // Total count
    const totalCount = await Listing.countDocuments(filter);

    // Paginated data
    const listings = await Listing.find(filter)
      .skip(from)
      .limit(size)
      .sort({ createdAt: -1 });

    return res.json({
      code: 0,
      data: listings,
      totalCount,
      message: "Listings retrieved successfully"
    });

  } catch (error) {
    return res.status(500).json({ code: 1, message: error.message });
  }
});


module.exports = { createListing, updateListing, deleteListing, getListing, getAllListingForInstructor ,getAllListingForUser};