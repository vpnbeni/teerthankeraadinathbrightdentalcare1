import { Plan } from "../models/index.js";
import {
  PlanError,
  ValidationError,
  DatabaseError,
  PaymentErrorCodes,
} from "./paymentErrors.js";
import { isValidObjectId } from "./requestUtils.js";

/**
 * Plan Validation Utilities
 * Comprehensive validation for subscription plans
 */

/**
 * Validate plan ID format
 * @param {string} planId - Plan ID to validate
 * @throws {ValidationError} If plan ID format is invalid
 */
export const validatePlanIdFormat = (planId) => {
  if (!planId) {
    throw new ValidationError(
      "Plan ID is required",
      PaymentErrorCodes.MISSING_PLAN_ID,
      { planId }
    );
  }

  if (typeof planId !== "string") {
    throw new ValidationError(
      "Plan ID must be a string",
      PaymentErrorCodes.INVALID_PLAN_ID_FORMAT,
      { planId, type: typeof planId }
    );
  }

  if (!isValidObjectId(planId)) {
    throw new ValidationError(
      "Invalid plan ID format",
      PaymentErrorCodes.INVALID_PLAN_ID_FORMAT,
      { planId }
    );
  }
};

/**
 * Validate plan existence and status
 * @param {string} planId - Plan ID to validate
 * @param {string} requestId - Request ID for tracking
 * @returns {Promise<Object>} Plan object if valid
 * @throws {PlanError} If plan is not found or inactive
 * @throws {DatabaseError} If database operation fails
 */
export const validatePlanExistenceAndStatus = async (
  planId,
  requestId = null
) => {
  let plan;

  try {
    plan = await Plan.findById(planId);
  } catch (dbError) {
    const errorMessage = `Database error while fetching plan: ${dbError.message}`;

    if (requestId) {
      console.error(`[${requestId}] ${errorMessage}`, {
        planId,
        error: dbError.message,
        stack: dbError.stack,
      });
    }

    throw new DatabaseError("Failed to validate plan details", {
      planId,
      originalError: dbError.message,
      requestId,
    });
  }

  if (!plan) {
    throw new PlanError("Plan not found", PaymentErrorCodes.PLAN_NOT_FOUND, {
      planId,
      requestId,
    });
  }

  if (!plan.isActive) {
    throw new PlanError(
      "Selected plan is not available",
      PaymentErrorCodes.PLAN_INACTIVE,
      {
        planId,
        planName: plan.name,
        isActive: plan.isActive,
        requestId,
      }
    );
  }

  return plan;
};

/**
 * Comprehensive plan validation
 * @param {string} planId - Plan ID to validate
 * @param {string} requestId - Request ID for tracking
 * @returns {Promise<Object>} Validated plan object
 * @throws {ValidationError|PlanError|DatabaseError} Various validation errors
 */
export const validatePlan = async (planId, requestId = null) => {
  // Step 1: Validate plan ID format
  validatePlanIdFormat(planId);

  // Step 2: Validate plan existence and status
  const plan = await validatePlanExistenceAndStatus(planId, requestId);

  // Step 3: Additional business logic validation
  validatePlanBusinessRules(plan, requestId);

  if (requestId) {
    console.log(`[${requestId}] Plan validation successful`, {
      planId: plan._id,
      planName: plan.name,
      price: plan.price,
      sessions: plan.sessions,
      isActive: plan.isActive,
    });
  }

  return plan;
};

/**
 * Validate plan business rules
 * @param {Object} plan - Plan object to validate
 * @param {string} requestId - Request ID for tracking
 * @throws {PlanError} If business rules are violated
 */
export const validatePlanBusinessRules = (plan, requestId = null) => {
  // Check if plan has valid price
  if (!plan.price || plan.price <= 0) {
    throw new PlanError(
      "Plan has invalid pricing",
      PaymentErrorCodes.PLAN_UNAVAILABLE,
      {
        planId: plan._id,
        planName: plan.name,
        price: plan.price,
        requestId,
      }
    );
  }

  // Check if plan has valid session count
  if (!plan.sessions || plan.sessions <= 0) {
    throw new PlanError(
      "Plan has invalid session configuration",
      PaymentErrorCodes.PLAN_UNAVAILABLE,
      {
        planId: plan._id,
        planName: plan.name,
        sessions: plan.sessions,
        requestId,
      }
    );
  }

  // Check if plan has valid duration
  if (!plan.duration || plan.duration <= 0) {
    throw new PlanError(
      "Plan has invalid duration configuration",
      PaymentErrorCodes.PLAN_UNAVAILABLE,
      {
        planId: plan._id,
        planName: plan.name,
        duration: plan.duration,
        requestId,
      }
    );
  }
};

/**
 * Get plan summary for logging and responses
 * @param {Object} plan - Plan object
 * @returns {Object} Plan summary
 */
export const getPlanSummary = (plan) => {
  return {
    id: plan._id,
    name: plan.name,
    price: plan.price,
    sessions: plan.sessions,
    duration: plan.duration,
    pricePerSession: plan.pricePerSession,
    monthlyPrice: plan.monthlyPrice,
    isActive: plan.isActive,
  };
};

/**
 * Validate multiple plans (for bulk operations)
 * @param {Array<string>} planIds - Array of plan IDs to validate
 * @param {string} requestId - Request ID for tracking
 * @returns {Promise<Array<Object>>} Array of validated plan objects
 * @throws {ValidationError|PlanError|DatabaseError} Various validation errors
 */
export const validateMultiplePlans = async (planIds, requestId = null) => {
  if (!Array.isArray(planIds)) {
    throw new ValidationError(
      "Plan IDs must be provided as an array",
      PaymentErrorCodes.INVALID_PLAN_ID_FORMAT,
      { planIds, requestId }
    );
  }

  if (planIds.length === 0) {
    throw new ValidationError(
      "At least one plan ID is required",
      PaymentErrorCodes.MISSING_PLAN_ID,
      { planIds, requestId }
    );
  }

  const validatedPlans = [];

  for (const planId of planIds) {
    const plan = await validatePlan(planId, requestId);
    validatedPlans.push(plan);
  }

  return validatedPlans;
};

/**
 * Check if user can purchase plan (additional business logic)
 * @param {Object} user - User object
 * @param {Object} plan - Plan object
 * @param {string} requestId - Request ID for tracking
 * @throws {ValidationError} If user cannot purchase plan
 */
export const validateUserPlanEligibility = (user, plan, requestId = null) => {
  // Check if user already has an active subscription
  if (user.subscription && user.subscription.status === "active") {
    // Allow upgrades but log for tracking
    if (requestId) {
      console.log(
        `[${requestId}] User has active subscription, allowing upgrade`,
        {
          userId: user._id,
          currentPlan: user.subscription.planId,
          newPlan: plan._id,
          currentStatus: user.subscription.status,
        }
      );
    }
  }

  // Additional eligibility checks can be added here
  // For example: geographic restrictions, user type restrictions, etc.
};

export default {
  validatePlanIdFormat,
  validatePlanExistenceAndStatus,
  validatePlan,
  validatePlanBusinessRules,
  getPlanSummary,
  validateMultiplePlans,
  validateUserPlanEligibility,
};
