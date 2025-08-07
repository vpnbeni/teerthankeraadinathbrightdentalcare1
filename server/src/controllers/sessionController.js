import { Session, Appointment, User } from "../models/index.js";

/**
 * Session Controller
 * Handles all session and medical record related HTTP requests
 */

/**
 * @desc    Create session record after appointment completion
 * @route   POST /api/sessions
 * @access  Private (Admin)
 */
export const createSession = async (req, res) => {
  try {
    const { appointmentId, examination, notes } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is required",
      });
    }

    // Verify appointment exists and is completed
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only create session for completed appointments",
      });
    }

    // Check if session already exists for this appointment
    const existingSession = await Session.findOne({ appointmentId });
    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: "Session already exists for this appointment",
      });
    }

    const session = await Session.create({
      appointmentId,
      userId: appointment.userId,
      examination: examination || {},
      notes,
      completedBy: req.user._id,
    });

    const populatedSession = await Session.findById(session._id)
      .populate("appointmentId", "date timeSlot sessionNumber")
      .populate("userId", "name phone email")
      .populate("completedBy", "name role");

    res.status(201).json({
      success: true,
      data: {
        session: populatedSession,
      },
      message: "Session record created successfully",
    });
  } catch (error) {
    console.error("Create session error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get session details
 * @route   GET /api/sessions/:sessionId
 * @access  Private
 */
export const getSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId)
      .populate("appointmentId", "date timeSlot sessionNumber")
      .populate("userId", "name phone email")
      .populate("completedBy", "name role");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Check if user owns this session or is admin
    if (
      req.user.role !== "admin" &&
      session.userId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        session,
      },
    });
  } catch (error) {
    console.error("Get session details error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update session record
 * @route   PUT /api/sessions/:sessionId
 * @access  Private (Admin)
 */
export const updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { examination, notes } = req.body;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    if (examination) {
      await session.updateExamination(examination);
    }

    if (notes !== undefined) {
      session.notes = notes;
      await session.save();
    }

    const updatedSession = await Session.findById(sessionId)
      .populate("appointmentId", "date timeSlot sessionNumber")
      .populate("userId", "name phone email")
      .populate("completedBy", "name role");

    res.status(200).json({
      success: true,
      data: {
        session: updatedSession,
      },
      message: "Session updated successfully",
    });
  } catch (error) {
    console.error("Update session error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get user's session history
 * @route   GET /api/sessions/user/:userId
 * @access  Private
 */
export const getUserSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if user is accessing their own sessions or is admin
    if (req.user.role !== "admin" && userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const sessions = await Session.getUserSessions(userId);

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedSessions = sessions.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        sessions: paginatedSessions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(sessions.length / parseInt(limit)),
          totalSessions: sessions.length,
          hasNext:
            parseInt(page) < Math.ceil(sessions.length / parseInt(limit)),
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get user sessions error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get current user's session history
 * @route   GET /api/sessions/my-sessions
 * @access  Private
 */
export const getMySessions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const sessions = await Session.getUserSessions(req.user._id);

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedSessions = sessions.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        sessions: paginatedSessions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(sessions.length / parseInt(limit)),
          totalSessions: sessions.length,
          hasNext:
            parseInt(page) < Math.ceil(sessions.length / parseInt(limit)),
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get my sessions error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Add custom field to session
 * @route   POST /api/sessions/:sessionId/custom-field
 * @access  Private (Admin)
 */
export const addCustomField = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { fieldName, fieldValue } = req.body;

    if (!fieldName || !fieldValue) {
      return res.status(400).json({
        success: false,
        message: "Field name and value are required",
      });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    await session.addCustomField(fieldName, fieldValue);

    const updatedSession = await Session.findById(sessionId)
      .populate("appointmentId", "date timeSlot sessionNumber")
      .populate("userId", "name phone email")
      .populate("completedBy", "name role");

    res.status(200).json({
      success: true,
      data: {
        session: updatedSession,
      },
      message: "Custom field added successfully",
    });
  } catch (error) {
    console.error("Add custom field error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Remove custom field from session
 * @route   DELETE /api/sessions/:sessionId/custom-field/:fieldName
 * @access  Private (Admin)
 */
export const removeCustomField = async (req, res) => {
  try {
    const { sessionId, fieldName } = req.params;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    await session.removeCustomField(fieldName);

    const updatedSession = await Session.findById(sessionId)
      .populate("appointmentId", "date timeSlot sessionNumber")
      .populate("userId", "name phone email")
      .populate("completedBy", "name role");

    res.status(200).json({
      success: true,
      data: {
        session: updatedSession,
      },
      message: "Custom field removed successfully",
    });
  } catch (error) {
    console.error("Remove custom field error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get all sessions (Admin only)
 * @route   GET /api/sessions/admin/all
 * @access  Private (Admin)
 */
export const getAllSessions = async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, userId } = req.query;

    let sessions;

    if (startDate && endDate) {
      sessions = await Session.getSessionsByDateRange(startDate, endDate);
    } else {
      sessions = await Session.find()
        .populate("appointmentId", "date timeSlot sessionNumber")
        .populate("userId", "name phone email")
        .populate("completedBy", "name role")
        .sort({ completedAt: -1 });
    }

    // Filter by userId if provided
    if (userId) {
      sessions = sessions.filter(
        (session) => session.userId._id.toString() === userId
      );
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedSessions = sessions.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        sessions: paginatedSessions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(sessions.length / parseInt(limit)),
          totalSessions: sessions.length,
          hasNext:
            parseInt(page) < Math.ceil(sessions.length / parseInt(limit)),
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get all sessions error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get session statistics (Admin only)
 * @route   GET /api/sessions/admin/statistics
 * @access  Private (Admin)
 */
export const getSessionStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const statistics = await Session.getSessionStatistics(start, end);
    const monthlyTrends = await Session.getMonthlySessionTrends(
      new Date().getFullYear()
    );

    // Additional statistics
    const totalSessions = await Session.countDocuments({
      completedAt: { $gte: start, $lte: end },
    });

    const todaySessions = await Session.countDocuments({
      completedAt: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lte: new Date().setHours(23, 59, 59, 999),
      },
    });

    res.status(200).json({
      success: true,
      data: {
        ...statistics,
        monthlyTrends,
        totalSessions,
        todaySessions,
        dateRange: {
          startDate: start,
          endDate: end,
        },
      },
    });
  } catch (error) {
    console.error("Get session statistics error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Search sessions with specific conditions (Admin only)
 * @route   POST /api/sessions/admin/search
 * @access  Private (Admin)
 */
export const searchSessions = async (req, res) => {
  try {
    const { condition } = req.body;

    if (!condition) {
      return res.status(400).json({
        success: false,
        message: "Search condition is required",
      });
    }

    const sessions = await Session.findSessionsWithCondition(condition);

    res.status(200).json({
      success: true,
      data: {
        sessions,
        totalResults: sessions.length,
        searchCondition: condition,
      },
    });
  } catch (error) {
    console.error("Search sessions error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get session summary for user (Admin only)
 * @route   GET /api/sessions/admin/user-summary/:userId
 * @access  Private (Admin)
 */
export const getUserSessionSummary = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const sessions = await Session.getUserSessions(userId);

    const summary = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(
        (s) => s.appointmentId.status === "completed"
      ).length,
      averageTeethPresent:
        sessions.reduce(
          (sum, s) => sum + (s.examination.teethPresent || 0),
          0
        ) / sessions.length || 0,
      totalMissingTeeth: sessions.reduce(
        (sum, s) => sum + (s.examination.missingTeeth?.length || 0),
        0
      ),
      sessionsWithCustomFields: sessions.filter((s) => s.hasCustomFields)
        .length,
      latestSession: sessions[0] || null,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        subscription: user.subscription,
      },
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
      },
    });
  } catch (error) {
    console.error("Get user session summary error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
