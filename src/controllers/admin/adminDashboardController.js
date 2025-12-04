const asyncHandler = require("express-async-handler");
const { Listing, Instructor } = require("../../models/models");







const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    // Create date range filter
    const dateFilter = {};
    if (fromDate || toDate) {
      dateFilter.createdAt = {};
      if (fromDate) {
        dateFilter.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        // Set to end of day for toDate
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = endOfDay;
      }
    }

    // Execute all queries in parallel for better performance
    const [
      listingPending,
      listingRejected,
      listingApproved,
      instructorPending,
      instructorRejected,
      instructorApproved
    ] = await Promise.all([
      // Listing counts
      Listing.countDocuments({ ...dateFilter, status: "pendingApproval", isDeleted: false }),
      Listing.countDocuments({ ...dateFilter, status: "rejected", isDeleted: false }),
      Listing.countDocuments({ ...dateFilter, status: "approved", isDeleted: false }),
      
      // Instructor counts
      Instructor.countDocuments({ ...dateFilter, role: "instructor", status: "pendingApproval" }),
      Instructor.countDocuments({ ...dateFilter, role: "instructor", status: "rejected" }),
      Instructor.countDocuments({ ...dateFilter, role: "instructor", status: "approved" })
    ]);

    // Get total counts (without date filter)
    const [
      totalListing,
      totalInstructor
    ] = await Promise.all([
      Listing.countDocuments({ isDeleted: false }),
      Instructor.countDocuments({ role: "instructor" })
    ]);

    const response = {
      code: 0,
      data: {
        // Listing statistics
        listing: {
          total: totalListing,
          pending: listingPending,
          rejected: listingRejected,
          approved: listingApproved,
          // Optional: Calculate percentages
          pendingPercentage: totalListing > 0 ? ((listingPending / totalListing) * 100).toFixed(2) : 0,
          rejectedPercentage: totalListing > 0 ? ((listingRejected / totalListing) * 100).toFixed(2) : 0,
          approvedPercentage: totalListing > 0 ? ((listingApproved / totalListing) * 100).toFixed(2) : 0
        },
        
        // Instructor statistics
        instructor: {
          total: totalInstructor,
          pending: instructorPending,
          rejected: instructorRejected,
          approved: instructorApproved,
          // Optional: Calculate percentages
          pendingPercentage: totalInstructor > 0 ? ((instructorPending / totalInstructor) * 100).toFixed(2) : 0,
          rejectedPercentage: totalInstructor > 0 ? ((instructorRejected / totalInstructor) * 100).toFixed(2) : 0,
          approvedPercentage: totalInstructor > 0 ? ((instructorApproved / totalInstructor) * 100).toFixed(2) : 0
        },
        
        // Date range info
        dateRange: {
          fromDate: fromDate || null,
          toDate: toDate || null,
          applied: !!(fromDate || toDate)
        },
        
        // Summary
        summary: {
          totalPending: listingPending + instructorPending,
          totalRejected: listingRejected + instructorRejected,
          totalApproved: listingApproved + instructorApproved,
          grandTotal: totalListing + totalInstructor
        }
      },
      message: "Dashboard statistics retrieved successfully"
    };

    res.json(response);

  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ 
      code: 1, 
      message: "Failed to retrieve dashboard statistics",
      error: error.message
    });
  }
});


module.exports = { 
  getDashboardStats
};