//  services/AuditTrailService.js
const { AuditTrail, Listing, User } = require("../models/models");

class AuditTrailService {
  static async logAction({
    collectionName,
    documentId,
    action,
    userId,
    userRole,
    userName,
    previousData = null,
    newData = null,
    changedFields = [],
    ipAddress = "",
    userAgent = "",
    req = null
  }) {
    try {
      // Extract IP and user agent from request if available
      if (req) {
        ipAddress = req.ip || req.connection.remoteAddress || req.socket?.remoteAddress || ipAddress;
        userAgent = req.get('User-Agent') || userAgent;
      }

      const auditLog = await AuditTrail.create({
        collectionName,
        documentId,
        action,
        userId,
        userRole,
        userName,
        previousData,
        newData,
        changedFields,
        ipAddress,
        userAgent,
        timestamp: new Date()
      });

      return auditLog;
    } catch (error) {
      console.error("Audit trail logging failed:", error);
      // Don't throw error to avoid breaking main functionality
      return null;
    }
  }

  static async getAuditTrails(collectionName, documentId, options = {}) {
    try {
      const { page = 1, limit = 50, action, startDate, endDate, userRole } = options;
      const skip = (page - 1) * limit;

      // Build filter dynamically
      const filter = { collectionName, documentId };
      
      if (action) filter.action = action;
      if (userRole) filter.userRole = userRole;
      
      // Date range filter
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
      }

      const auditTrails = await AuditTrail.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email mobileNo role");

      const total = await AuditTrail.countDocuments(filter);

      return {
        auditTrails,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          collectionName,
          documentId,
          action,
          startDate,
          endDate,
          userRole
        }
      };
    } catch (error) {
      console.error("Error in getAuditTrails:", error);
      throw error;
    }
  }

  // Get audit trails for a specific user across all collections
  static async getUserAuditTrails(userId, options = {}) {
    try {
      const { page = 1, limit = 50, collectionName, action, startDate, endDate } = options;
      const skip = (page - 1) * limit;

      const filter = { userId };
      
      if (collectionName) filter.collectionName = collectionName;
      if (action) filter.action = action;
      
      // Date range filter
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
      }

      const auditTrails = await AuditTrail.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email mobileNo role");

      const total = await AuditTrail.countDocuments(filter);

      return {
        auditTrails,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          userId,
          collectionName,
          action,
          startDate,
          endDate
        }
      };
    } catch (error) {
      console.error("Error in getUserAuditTrails:", error);
      throw error;
    }
  }

  // Get system-wide audit trails with comprehensive filtering
  static async getSystemAuditTrails(options = {}) {
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
      } = options;
      
      const skip = (page - 1) * limit;
      
      const filter = {};
      
      // Build filter dynamically
      if (collectionName) filter.collectionName = collectionName;
      if (action) filter.action = action;
      if (userRole) filter.userRole = userRole;
      if (userId) filter.userId = userId;
      if (documentId) filter.documentId = documentId;
      
      // Date range filter
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
      }

      const auditTrails = await AuditTrail.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email mobileNo role");

      const total = await AuditTrail.countDocuments(filter);

      return {
        auditTrails,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          collectionName,
          action,
          startDate,
          endDate,
          userRole,
          userId,
          documentId
        }
      };
    } catch (error) {
      console.error("Error in getSystemAuditTrails:", error);
      throw error;
    }
  }

  // Get audit summary for a document
  static async getAuditSummary(collectionName, documentId) {
    try {
      const summary = await AuditTrail.aggregate([
        {
          $match: {
            collectionName,
            documentId: new mongoose.Types.ObjectId(documentId)
          }
        },
        {
          $group: {
            _id: "$action",
            count: { $sum: 1 },
            lastAction: { $max: "$timestamp" },
            users: { $addToSet: "$userId" }
          }
        },
        {
          $project: {
            action: "$_id",
            count: 1,
            lastAction: 1,
            uniqueUsers: { $size: "$users" },
            _id: 0
          }
        }
      ]);

      const totalActions = await AuditTrail.countDocuments({
        collectionName,
        documentId
      });

      const firstAction = await AuditTrail.findOne({
        collectionName,
        documentId
      }).sort({ timestamp: 1 }).select("timestamp action userName");

      return {
        summary,
        totalActions,
        firstAction: firstAction ? {
          timestamp: firstAction.timestamp,
          action: firstAction.action,
          userName: firstAction.userName
        } : null
      };
    } catch (error) {
      console.error("Error in getAuditSummary:", error);
      throw error;
    }
  }

  // Get recent activities across all collections
  static async getRecentActivities(options = {}) {
    try {
      const { limit = 20, collectionNames = [], actions = [] } = options;
      
      const filter = {};
      
      if (collectionNames.length > 0) {
        filter.collectionName = { $in: collectionNames };
      }
      
      if (actions.length > 0) {
        filter.action = { $in: actions };
      }

      const activities = await AuditTrail.find(filter)
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate("userId", "name email mobileNo role")
        .select("collectionName documentId action userName userRole timestamp changedFields");

      return activities;
    } catch (error) {
      console.error("Error in getRecentActivities:", error);
      throw error;
    }
  }

  // Check if user has permission to view audit trails
  static async hasAuditPermission(userId, collectionName, documentId) {
    try {
      // Add your permission logic here
      // For example, check if user is admin, owner of the document, etc.
    //   const user = await User.findById(userId);
      
    //   if (!user) return false;
      
      // Admin can view all audit trails
      // if (user.role === 'admin') return true;
      
      // For specific collections, check ownership
      // if (collectionName === 'Listing') {
      //   const listing = await Listing.findById(documentId);
      //   return listing && listing.instructorId.toString() === userId.toString();
      // }
      
      // if (collectionName === 'User') {
      //   return documentId.toString() === userId.toString();
      // }
      
      // Add more collection-specific permission checks as needed
      
      return true;
    } catch (error) {
      console.error("Error in hasAuditPermission:", error);
      return false;
    }
  }
}

module.exports = AuditTrailService; 