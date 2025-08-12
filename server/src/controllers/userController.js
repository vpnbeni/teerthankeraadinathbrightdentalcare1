import { User, Appointment, Payment } from "../models/index.js";
import path from "path";
import fs from "fs";
import { fileService } from "../services/fileService.js";

/**
 * User Management Controller
 * Handles all user management related HTTP requests (Admin functionality)
 */

/**
 * @desc    Get all users with filtering and pagination (Admin only)
 * @route   GET /api/users
 * @access  Private (Admin)
 */
export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      subscriptionStatus,
      isVerified,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    let query = {};

    // Search by name, phone, or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by subscription status
    if (subscriptionStatus) {
      query["subscription.status"] = subscriptionStatus;
    }

    // Filter by verification status
    if (isVerified !== undefined) {
      query.isVerified = isVerified === "true";
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const users = await User.find(query)
      .select("-passwordHash")
      .populate("subscription.planId", "name sessions price duration")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalUsers: total,
          hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get user details by ID
 * @route   GET /api/users/:userId
 * @access  Private (Admin or Self)
 */
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is accessing their own data or is admin
    if (req.user.role !== "admin" && userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const user = await User.findById(userId)
      .select("-passwordHash")
      .populate("subscription.planId", "name sessions price duration");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get additional user statistics if admin
    let userStats = {};
    if (req.user.role === "admin") {
      const [appointmentCount, paymentCount] = await Promise.all([
        Appointment.countDocuments({ userId }),
        Payment.countDocuments({ userId, status: "completed" }),
      ]);

      const totalSpent = await Payment.aggregate([
        { $match: { userId: user._id, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      userStats = {
        totalAppointments: appointmentCount,
        totalPayments: paymentCount,
        totalSpent: totalSpent[0]?.total || 0,
      };
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        ...(req.user.role === "admin" && { statistics: userStats }),
      },
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/:userId
 * @access  Private (Admin or Self)
 */
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Check if user is updating their own data or is admin
    if (req.user.role !== "admin" && userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Restrict certain fields for non-admin users
    if (req.user.role !== "admin") {
      delete updates.role;
      delete updates.isVerified;
      delete updates.subscription;
    }

    // Update allowed fields
    const allowedUpdates = [
      "name",
      "email",
      "address",
      "gender",
      "alternativePhone",
      "medicalInfo",
    ];

    // Admin can update additional fields
    if (req.user.role === "admin") {
      allowedUpdates.push("role", "isVerified");
    }

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        if (field === "medicalInfo" && typeof updates[field] === "object") {
          user.medicalInfo = { ...user.medicalInfo, ...updates[field] };
        } else {
          user[field] = updates[field];
        }
      }
    });

    await user.save();

    const updatedUser = await User.findById(userId)
      .select("-passwordHash")
      .populate("subscription.planId", "name sessions price duration");

    res.status(200).json({
      success: true,
      data: {
        user: updatedUser,
      },
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update user subscription (Admin only)
 * @route   PUT /api/users/:userId/subscription
 * @access  Private (Admin)
 */
export const updateUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const { planId, startDate, endDate, sessionsRemaining, status } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update subscription fields
    if (planId) user.subscription.planId = planId;
    if (startDate) user.subscription.startDate = new Date(startDate);
    if (endDate) user.subscription.endDate = new Date(endDate);
    if (sessionsRemaining !== undefined)
      user.subscription.sessionsRemaining = sessionsRemaining;
    if (status) user.subscription.status = status;

    await user.save();

    const updatedUser = await User.findById(userId)
      .select("-passwordHash")
      .populate("subscription.planId", "name sessions price duration");

    res.status(200).json({
      success: true,
      data: {
        user: updatedUser,
      },
      message: "User subscription updated successfully",
    });
  } catch (error) {
    console.error("Update user subscription error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Delete user (Admin only)
 * @route   DELETE /api/users/:userId
 * @access  Private (Admin)
 */
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user has active appointments
    const activeAppointments = await Appointment.countDocuments({
      userId,
      status: { $in: ["scheduled", "confirmed"] },
      date: { $gte: new Date() },
    });

    if (activeAppointments > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete user with active appointments",
      });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      data: {
        userId,
      },
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get user dashboard statistics
 * @route   GET /api/users/dashboard/stats
 * @access  Private
 */
export const getUserDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [totalAppointments, upcomingAppointments, totalPayments] =
      await Promise.all([
        Appointment.countDocuments({ userId }),
        Appointment.countDocuments({
          userId,
          status: { $in: ["scheduled", "confirmed"] },
          date: { $gte: new Date() },
        }),
        Payment.countDocuments({ userId, status: "completed" }),
      ]);

    const recentAppointmentsRaw = await Appointment.find({ userId })
      .sort({ date: -1 })
      .limit(5)
      .populate("userId", "name phone email");

    // Filter out appointments with deleted users
    const recentAppointments = recentAppointmentsRaw.filter(
      (appointment) => appointment.userId !== null
    );

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalAppointments,
          upcomingAppointments,
          totalPayments,
          subscription: req.user.subscription,
        },
        recentAppointments,
      },
    });
  } catch (error) {
    console.error("Get user dashboard stats error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/users/admin/dashboard-stats
 * @access  Private (Admin)
 */
export const getAdminDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeSubscriptions,
      totalAppointments,
      todayAppointments,
      totalRevenue,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ "subscription.status": "active" }),
      Appointment.countDocuments(),
      Appointment.countDocuments({
        date: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lte: new Date().setHours(23, 59, 59, 999),
        },
      }),
      Payment.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const recentUsers = await User.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("subscription.planId", "name sessions price");

    const upcomingAppointmentsRaw = await Appointment.find({
      date: { $gte: new Date() },
      status: { $in: ["scheduled", "confirmed"] },
    })
      .sort({ date: 1 })
      .limit(10)
      .populate("userId", "name phone email");

    // Filter out appointments with deleted users
    const upcomingAppointments = upcomingAppointmentsRaw.filter(
      (appointment) => appointment.userId !== null
    );

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalUsers,
          activeSubscriptions,
          totalAppointments,
          todayAppointments,
          totalRevenue: totalRevenue[0]?.total || 0,
        },
        recentUsers,
        upcomingAppointments,
      },
    });
  } catch (error) {
    console.error("Get admin dashboard stats error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get user activity log (Admin only)
 * @route   GET /api/users/:userId/activity
 * @access  Private (Admin)
 */
export const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's appointments, sessions, and payments
    const [appointmentsRaw, payments] = await Promise.all([
      Appointment.find({ userId })
        .sort({ createdAt: -1 })
        .populate("userId", "name phone"),
      Payment.find({ userId })
        .sort({ transactionDate: -1 })
        .populate("planId", "name sessions price"),
    ]);

    // Filter out appointments with deleted users
    const appointments = appointmentsRaw.filter(
      (appointment) => appointment.userId !== null
    );

    // Combine and sort all activities
    const activities = [
      ...appointments.map((apt) => ({
        type: "appointment",
        date: apt.createdAt,
        data: apt,
      })),
      ...payments.map((payment) => ({
        type: "payment",
        date: payment.transactionDate,
        data: payment,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedActivities = activities.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        activities: paginatedActivities,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(activities.length / parseInt(limit)),
          totalActivities: activities.length,
          hasNext:
            parseInt(page) < Math.ceil(activities.length / parseInt(limit)),
          hasPrev: parseInt(page) > 1,
        },
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error("Get user activity error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Search users (Admin only)
 * @route   POST /api/users/search
 * @access  Private (Admin)
 */
export const searchUsers = async (req, res) => {
  try {
    const { query, filters = {} } = req.body;

    let searchQuery = {};

    // Text search
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ];
    }

    // Apply filters
    if (filters.role) searchQuery.role = filters.role;
    if (filters.subscriptionStatus)
      searchQuery["subscription.status"] = filters.subscriptionStatus;
    if (filters.isVerified !== undefined)
      searchQuery.isVerified = filters.isVerified;
    if (filters.planId) searchQuery["subscription.planId"] = filters.planId;

    const users = await User.find(searchQuery)
      .select("-passwordHash")
      .populate("subscription.planId", "name sessions price duration")
      .sort({ createdAt: -1 })
      .limit(50); // Limit search results

    res.status(200).json({
      success: true,
      data: {
        users,
        totalResults: users.length,
        searchQuery: query,
        filters,
      },
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    // Session info removed
    res.json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update personal information
export const updatePersonalInfo = async (req, res) => {
  try {
    const { name, email, phone, address, gender, alternativePhone } = req.body;
    const user = await User.findById(req.user._id);

    user.name = name;
    user.email = email;
    user.phone = phone;
    user.address = address;
    user.gender = gender;
    user.alternativePhone = alternativePhone;

    await user.save();

    res.json({
      success: true,
      message: "Personal information updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update medical information
export const updateMedicalInfo = async (req, res) => {
  try {
    const {
      systemicDiseases,
      drugAllergies,
      isPregnant,
      pastTreatments,
      previousExperiences,
    } = req.body;

    const user = await User.findById(req.user._id);

    user.medicalInfo = {
      systemicDiseases,
      drugAllergies,
      isPregnant,
      pastTreatments,
      previousExperiences,
    };

    await user.save();

    res.json({
      success: true,
      message: "Medical information updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get user documents
export const getDocuments = async (req, res) => {
  try {
    // Get user documents directly from database
    const user = await User.findById(req.user._id).select("documents");

    // Map documents to ensure consistent structure
    const documents = user.documents.map((doc) => ({
      _id: doc._id,
      type: doc.type,
      fileUrl: doc.url || doc.fileUrl, // Handle both Cloudinary (url) and local (fileUrl)
      uploadDate: doc.uploadDate,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
    }));

    res.json({
      success: true,
      data: {
        documents: documents || [],
      },
    });
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Upload document
export const uploadDocument = async (req, res) => {
  try {
    console.log("Upload request received:", {
      file: req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : null,
      body: req.body,
      userId: req.user?._id,
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { type } = req.body;
    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Document type is required",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Try to use Cloudinary first, fallback to local storage
    console.log("Attempting Cloudinary upload with credentials:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? "***" : "missing",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "***" : "missing",
    });

    try {
      const result = await fileService.uploadUserDocument(
        req.user._id,
        req.file,
        type
      );

      console.log("Document uploaded to Cloudinary:", result);

      // Get the updated user to return the document with the correct structure
      const updatedUser = await User.findById(req.user._id);
      const uploadedDocument =
        updatedUser.documents[updatedUser.documents.length - 1];

      res.json({
        success: true,
        message: "Document uploaded successfully",
        data: {
          _id: uploadedDocument._id,
          type: uploadedDocument.type,
          fileUrl: uploadedDocument.url, // Map url to fileUrl for consistency
          uploadDate: uploadedDocument.uploadDate,
          fileName: req.file.originalname,
          fileSize: req.file.size,
        },
      });
    } catch (cloudinaryError) {
      console.error(
        "Cloudinary upload failed with full error:",
        cloudinaryError
      );
      console.warn(
        "Cloudinary upload failed, using local storage:",
        cloudinaryError.message
      );

      // Fallback to local storage approach
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1e9);
      const fileName = `file-${timestamp}-${randomSuffix}${path.extname(
        req.file.originalname
      )}`;
      const filePath = path.join(
        process.cwd(),
        "uploads",
        "documents",
        fileName
      );

      // Save file locally
      fs.writeFileSync(filePath, req.file.buffer);

      const newDocument = {
        type,
        fileUrl: `uploads/documents/${fileName}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        uploadDate: new Date(),
      };

      user.documents.push(newDocument);
      await user.save();

      console.log("Document saved locally:", newDocument);

      res.json({
        success: true,
        message: "Document uploaded successfully",
        data: user.documents[user.documents.length - 1],
      });
    }
  } catch (error) {
    console.error("Upload document error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete document
export const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    // Find the document first
    const user = await User.findById(req.user._id);
    const documentIndex = user.documents.findIndex(
      (doc) => doc._id.toString() === documentId
    );

    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const document = user.documents[documentIndex];

    // Try fileService first, fallback to local deletion
    try {
      await fileService.deleteUserDocument(req.user._id, document.type);
    } catch (fileServiceError) {
      console.warn(
        "FileService delete failed, using local deletion:",
        fileServiceError.message
      );

      // Fallback to local file deletion
      if (document.fileUrl && document.fileUrl.startsWith("uploads/")) {
        const filePath = path.join(process.cwd(), document.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Remove from user documents
      user.documents.splice(documentIndex, 1);
      await user.save();
    }

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get document file
export const getDocumentFile = async (req, res) => {
  try {
    const { documentId } = req.params;
    const user = await User.findById(req.user._id);

    const document = user.documents.find(
      (doc) => doc._id.toString() === documentId
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const filePath = path.join(process.cwd(), document.fileUrl);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server",
      });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error("Get document file error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get subscription details
export const getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("subscription");
    res.json({
      success: true,
      data: {
        subscription: user.subscription || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get comprehensive user details for admin tabbed interface
 * @route   GET /api/admin/users/:id/details
 * @access  Private (Admin)
 */
export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select("-passwordHash")
      .populate("subscription.planId", "name sessions price duration");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user statistics
    const [appointmentCount, sessionCount, paymentCount, totalSpent] =
      await Promise.all([
        Appointment.countDocuments({ userId: id }),
        Payment.countDocuments({ userId: id, status: "completed" }),
        Payment.aggregate([
          { $match: { userId: user._id, status: "completed" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);

    // Get recent activity
    const recentAppointments = await Appointment.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("date timeSlot status sessionNumber");

    const recentPayments = await Payment.find({
      userId: id,
      status: "completed",
    })
      .sort({ transactionDate: -1 })
      .limit(3)
      .populate("planId", "name sessions price")
      .select("amount transactionDate paymentMethod planId");

    res.status(200).json({
      success: true,
      data: {
        user,
        statistics: {
          totalAppointments: appointmentCount,
          totalPayments: paymentCount,
          totalSpent: totalSpent[0]?.total || 0,
        },
        recentActivity: {
          appointments: recentAppointments,
          payments: recentPayments,
        },
      },
    });
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update user personal information (Admin)
 * @route   PUT /api/admin/users/:id/personal
 * @access  Private (Admin)
 */
export const updateUserPersonalInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, gender, alternativePhone } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required fields",
      });
    }

    // Check if phone number is already taken by another user
    if (phone !== user.phone) {
      const existingUser = await User.findOne({ phone, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Phone number is already registered",
        });
      }
    }

    // Check if email is already taken by another user (if provided)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email is already registered",
        });
      }
    }

    // Update personal information
    user.name = name;
    user.phone = phone;
    user.email = email || user.email;
    user.address = address || user.address;
    user.gender = gender || user.gender;
    user.alternativePhone = alternativePhone || user.alternativePhone;

    await user.save();

    const updatedUser = await User.findById(id)
      .select("-passwordHash")
      .populate("subscription.planId", "name sessions price duration");

    res.status(200).json({
      success: true,
      data: {
        user: updatedUser,
      },
      message: "Personal information updated successfully",
    });
  } catch (error) {
    console.error("Update user personal info error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update user medical information (Admin)
 * @route   PUT /api/admin/users/:id/medical
 * @access  Private (Admin)
 */
export const updateUserMedicalInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      systemicDiseases,
      drugAllergies,
      isPregnant,
      pastTreatments,
      previousExperiences,
    } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update medical information
    user.medicalInfo = {
      systemicDiseases: systemicDiseases || [],
      drugAllergies: drugAllergies || [],
      isPregnant: isPregnant || false,
      pastTreatments: pastTreatments || [],
      previousExperiences: previousExperiences || [],
    };

    await user.save();

    const updatedUser = await User.findById(id)
      .select("-passwordHash")
      .populate("subscription.planId", "name sessions price duration");

    res.status(200).json({
      success: true,
      data: {
        user: updatedUser,
      },
      message: "Medical information updated successfully",
    });
  } catch (error) {
    console.error("Update user medical info error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get user payment history (Admin)
 * @route   GET /api/admin/users/:id/payments
 * @access  Private (Admin)
 */
export const getUserPayments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    // Verify user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Build query
    let query = { userId: id };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) {
        query.transactionDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.transactionDate.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("planId", "name sessions price duration")
        .sort({ transactionDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payment.countDocuments(query),
    ]);

    // Calculate payment statistics
    const paymentStats = await Payment.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const stats = {
      total: 0,
      completed: 0,
      pending: 0,
      failed: 0,
      totalAmount: 0,
      completedAmount: 0,
    };

    paymentStats.forEach((stat) => {
      stats.total += stat.count;
      stats[stat._id] = stat.count;
      stats.totalAmount += stat.totalAmount;
      if (stat._id === "completed") {
        stats.completedAmount = stat.totalAmount;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        payments,
        statistics: stats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalPayments: total,
          hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrev: parseInt(page) > 1,
        },
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error("Get user payments error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get user appointment/booking history (Admin)
 * @route   GET /api/admin/users/:id/bookings
 * @access  Private (Admin)
 */
export const getUserBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    // Verify user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Build query
    let query = { userId: id };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const [appointmentsRaw, total] = await Promise.all([
      Appointment.find(query)
        .populate("userId", "name phone email")
        .populate("cancellationDetails.cancelledBy", "name role")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Appointment.countDocuments(query),
    ]);

    // Filter out appointments with deleted users
    const appointments = appointmentsRaw.filter(
      (appointment) => appointment.userId !== null
    );

    // Calculate appointment statistics
    const appointmentStats = await Appointment.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      total: 0,
      scheduled: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      rescheduled: 0,
    };

    appointmentStats.forEach((stat) => {
      stats.total += stat.count;
      stats[stat._id] = stat.count;
    });

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.find({
      userId: id,
      date: { $gte: new Date() },
      status: { $in: ["scheduled", "confirmed"] },
    })
      .sort({ date: 1 })
      .limit(5)
      .select("date timeSlot status sessionNumber");

    res.status(200).json({
      success: true,
      data: {
        appointments,
        statistics: stats,
        upcomingAppointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalAppointments: total,
          hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrev: parseInt(page) > 1,
        },
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          subscription: user.subscription,
        },
      },
    });
  } catch (error) {
    console.error("Get user bookings error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
/**
 * @desc    Get recent users for dashboard
 * @route   GET /api/admin/users/recent
 * @access  Private (Admin)
 */
export const getRecentUsers = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const recentUsers = await User.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("subscription.planId", "name sessions price");

    res.status(200).json({
      success: true,
      data: {
        users: recentUsers,
        total: recentUsers.length,
      },
    });
  } catch (error) {
    console.error("Get recent users error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
