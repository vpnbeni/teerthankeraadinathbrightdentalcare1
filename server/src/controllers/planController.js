import Plan from "../models/Plan.js";

/**
 * Plan Controller
 * Handles all plan-related HTTP requests
 */

/**
 * @desc    Get all active plans
 * @route   GET /api/plans
 * @access  Public
 */
export const getPlans = async (req, res) => {
  try {
    const plans = await Plan.getActivePlans();

    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    console.error("Get plans error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching plans",
    });
  }
};

/**
 * @desc    Get single plan by ID
 * @route   GET /api/plans/:id
 * @access  Public
 */
export const getPlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    if (!plan.isActive) {
      return res.status(404).json({
        success: false,
        message: "Plan is not available",
      });
    }

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("Get plan error:", error);

    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while fetching plan",
    });
  }
};

/**
 * @desc    Create new plan
 * @route   POST /api/plans
 * @access  Private/Admin
 */
export const createPlan = async (req, res) => {
  try {
    const { name, sessions, price, duration, description, features } = req.body;

    // Validation
    if (!name || !sessions || !price || !duration) {
      return res.status(400).json({
        success: false,
        message: "Name, sessions, price, and duration are required",
      });
    }

    const plan = await Plan.create({
      name,
      sessions,
      price,
      duration,
      description,
      features: features || [],
    });

    res.status(201).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("Create plan error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating plan",
    });
  }
};

/**
 * @desc    Update plan
 * @route   PUT /api/plans/:id
 * @access  Private/Admin
 */
export const updatePlan = async (req, res) => {
  try {
    const { name, sessions, price, duration, description, features, isActive } =
      req.body;

    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      {
        name,
        sessions,
        price,
        duration,
        description,
        features,
        isActive,
        updatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("Update plan error:", error);

    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating plan",
    });
  }
};

/**
 * @desc    Delete plan (soft delete - set isActive to false)
 * @route   DELETE /api/plans/:id
 * @access  Private/Admin
 */
export const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        message: "Plan deactivated successfully",
      },
    });
  } catch (error) {
    console.error("Delete plan error:", error);

    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while deleting plan",
    });
  }
};
