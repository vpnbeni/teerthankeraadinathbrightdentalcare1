/**
 * Admin Authorization Middleware
 * Ensures only admin users can access protected routes
 */

export const adminOnly = (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Authentication required.",
        code: "AUTHENTICATION_REQUIRED",
      });
    }

    // Check if user has admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
        code: "ADMIN_ACCESS_REQUIRED",
        userRole: req.user.role,
      });
    }

    // User is admin, proceed to next middleware
    next();
  } catch (error) {
    console.error("Admin authorization error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authorization",
      code: "AUTHORIZATION_ERROR",
    });
  }
};

export default adminOnly;
