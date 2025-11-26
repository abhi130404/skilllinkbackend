const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const { Listing, User, Instructor, Enrollment, Payment, Review, AuditTrail } = require("../models/models");
const AuditTrailService = require("../services/AuditTrailService");




// Get audit trails for a specific document in any collection
const getCollectionAuditTrails = asyncHandler(async (req, res) => {
  try {
    const { collectionName, id } = req.params;
    const { page = 1, limit = 50, action, startDate, endDate, userRole } = req.query;

    // Validate collection name
    const validCollections = ["Listing", "User", "Instructor", "Enrollment", "Payment", "Review"];
    if (!validCollections.includes(collectionName)) {
      return res.status(400).json({ 
        code: 1, 
        message: "Invalid collection name. Valid collections: " + validCollections.join(", ") 
      });
    }

    // Validate document ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        code: 1, 
        message: "Invalid document ID format" 
      });
    }

    // Check permission
    const hasPermission = await AuditTrailService.hasAuditPermission(
      req.user._id, 
      collectionName, 
      id
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        code: 1, 
        message: "Access denied. You don't have permission to view these audit trails." 
      });
    }

    // Check if document exists in the specified collection
    let document;
    try {
      let Model;
      switch (collectionName) {
        case "Listing":
          Model = Listing;
          break;
        case "User":
          Model = User;
          break;
        case "Instructor":
          Model = Instructor;
          break;
        case "Enrollment":
          Model = Enrollment;
          break;
        case "Payment":
          Model = Payment;
          break;
        case "Review":
          Model = Review;
          break;
        default:
          return res.status(400).json({ 
            code: 1, 
            message: "Invalid collection name" 
          });
      }

      document = await Model.findById(id);
      if (!document) {
        return res.status(404).json({ 
          code: 1, 
          message: `${collectionName} not found with the provided ID` 
        });
      }
    } catch (error) {
      return res.status(400).json({ 
        code: 1, 
        message: `Error finding document: ${error.message}` 
      });
    }

    const auditData = await AuditTrailService.getAuditTrails(
      collectionName, 
      id, 
      { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        action,
        startDate,
        endDate,
        userRole
      }
    );

    res.json({ 
      code: 0, 
      data: {
        ...auditData,
        collectionName,
        documentId: id,
        documentInfo: {
          _id: document._id,
          ...(collectionName === "Listing" && { 
            title: document.title,
            type: document.type,
            status: document.status 
          }),
          ...(collectionName === "User" && { 
            name: document.name, 
            emailID: document.emailID,
            mobileNo: document.mobileNo,
            role: document.role 
          }),
          ...(collectionName === "Instructor" && { 
            name: document.name, 
            instructorId: document.instructorId,
            status: document.status 
          }),
          ...(collectionName === "Enrollment" && { 
            status: document.status,
            userId: document.userId,
            listingId: document.listingId 
          }),
          ...(collectionName === "Payment" && { 
            status: document.status, 
            amount: document.amount,
            paymentType: document.paymentType 
          }),
          ...(collectionName === "Review" && { 
            rating: document.rating,
            userId: document.userId,
            listingId: document.listingId 
          }),
        }
      },
      message: `Audit trails retrieved successfully for ${collectionName}` 
    });
  } catch (error) {
    console.error("Error in getCollectionAuditTrails:", error);
    res.status(500).json({ code: 1, message: error.message });
  }
});

// Get audit summary for a document
const getAuditSummary = asyncHandler(async (req, res) => {
  try {
    const { collectionName, id } = req.params;

    // Validate collection name
    const validCollections = ["Listing", "User", "Instructor", "Enrollment", "Payment", "Review"];
    if (!validCollections.includes(collectionName)) {
      return res.status(400).json({ 
        code: 1, 
        message: "Invalid collection name. Valid collections: " + validCollections.join(", ") 
      });
    }

    // Validate document ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        code: 1, 
        message: "Invalid document ID format" 
      });
    }

    // Check permission
    const hasPermission = await AuditTrailService.hasAuditPermission(
      req.user._id, 
      collectionName, 
      id
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        code: 1, 
        message: "Access denied. You don't have permission to view this audit summary." 
      });
    }

    const summary = await AuditTrailService.getAuditSummary(collectionName, id);

    res.json({ 
      code: 0, 
      data: summary,
      message: `Audit summary retrieved successfully for ${collectionName}` 
    });
  } catch (error) {
    console.error("Error in getAuditSummary:", error);
    res.status(500).json({ code: 1, message: error.message });
  }
});

// Get audit trails for a specific user
const getUserAuditTrails = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50, collectionName, action, startDate, endDate } = req.query;

    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        code: 1, 
        message: "Invalid user ID format" 
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        code: 1, 
        message: "User not found" 
      });
    }

    // Only allow users to view their own audit trails or admin to view any
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ 
        code: 1, 
        message: "Access denied. You can only view your own audit trails." 
      });
    }

    const auditData = await AuditTrailService.getUserAuditTrails(
      userId, 
      { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        collectionName,
        action,
        startDate,
        endDate
      }
    );

    res.json({ 
      code: 0, 
      data: {
        ...auditData,
        userInfo: {
          _id: user._id,
          name: user.name,
          emailID: user.emailID,
          role: user.role
        }
      },
      message: "User audit trails retrieved successfully" 
    });
  } catch (error) {
    console.error("Error in getUserAuditTrails:", error);
    res.status(500).json({ code: 1, message: error.message });
  }
});

// Get current user's audit trails
const getMyAuditTrails = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 50, collectionName, action, startDate, endDate } = req.query;

    const auditData = await AuditTrailService.getUserAuditTrails(
      req.user._id, 
      { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        collectionName,
        action,
        startDate,
        endDate
      }
    );

    res.json({ 
      code: 0, 
      data: {
        ...auditData,
        userInfo: {
          _id: req.user._id,
          name: req.user.name,
          emailID: req.user.emailID,
          role: req.user.role
        }
      },
      message: "Your audit trails retrieved successfully" 
    });
  } catch (error) {
    console.error("Error in getMyAuditTrails:", error);
    res.status(500).json({ code: 1, message: error.message });
  }
});

// Get system-wide audit trails (Admin only)
const getSystemAuditTrails = asyncHandler(async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      collectionName, 
      action, 
      startDate, 
      endDate,
      userRole,
      userId,
      documentId
    } = req.query;

    const auditData = await AuditTrailService.getSystemAuditTrails({
      page: parseInt(page), 
      limit: parseInt(limit), 
      collectionName,
      action,
      startDate,
      endDate,
      userRole,
      userId,
      documentId
    });

    res.json({ 
      code: 0, 
      data: auditData,
      message: "System audit trails retrieved successfully" 
    });
  } catch (error) {
    console.error("Error in getSystemAuditTrails:", error);
    res.status(500).json({ code: 1, message: error.message });
  }
});

// Get recent activities
const getRecentActivities = asyncHandler(async (req, res) => {
  try {
    const { limit = 20, collectionNames, actions } = req.query;

    // Parse array parameters
    const collectionNamesArray = collectionNames ? collectionNames.split(',') : [];
    const actionsArray = actions ? actions.split(',') : [];

    const activities = await AuditTrailService.getRecentActivities({
      limit: parseInt(limit),
      collectionNames: collectionNamesArray,
      actions: actionsArray
    });

    res.json({ 
      code: 0, 
      data: activities,
      message: "Recent activities retrieved successfully" 
    });
  } catch (error) {
    console.error("Error in getRecentActivities:", error);
    res.status(500).json({ code: 1, message: error.message });
  }
});

module.exports = {
  getCollectionAuditTrails,
  getAuditSummary,
  getUserAuditTrails,
  getMyAuditTrails,
  getSystemAuditTrails,
  getRecentActivities
};