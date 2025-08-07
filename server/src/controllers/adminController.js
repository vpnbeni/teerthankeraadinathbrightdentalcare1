import { syncAllUsersSessionCounts } from "../utils/sessionCalculator.js";

/**
 * Admin Controller
 * Handles admin-specific operations
 */

/**
 * @desc    Sync all users' session counts
 * @route   POST /api/admin/sync-sessions
 * @access  Private (Admin)
 */
export const syncUserSessions = async (req, res) => {
  try {
    const result = await syncAllUsersSessionCounts();

    res.status(200).json({
      success: true,
      data: result,
      message: "Session sync completed successfully",
    });
  } catch (error) {
    console.error("Admin sync sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while syncing user sessions",
    });
  }
};
