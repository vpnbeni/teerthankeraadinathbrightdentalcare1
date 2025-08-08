import mongoose from "mongoose";
import { User, Appointment, Payment, Plan } from "../models/index.js";

/**
 * Analytics Controller
 * Handles all analytics and reporting related HTTP requests
 */

/**
 * @desc    Get appointment analytics for admin
 * @route   GET /api/admin/analytics/appointments
 * @access  Private (Admin)
 */
export const getAdminAppointmentAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Appointment status distribution
    const statusDistribution = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Daily appointment trends
    const dailyTrends = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" },
          },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          scheduled: {
            $sum: { $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0] },
          },
          confirmed: {
            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);

    // Time slot popularity analysis
    const timeSlotPopularity = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: "$timeSlot",
          count: { $sum: 1 },
          completionRate: {
            $avg: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Appointment completion and cancellation rates
    const completionStats = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          scheduled: {
            $sum: { $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0] },
          },
          confirmed: {
            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
          },
          rescheduled: {
            $sum: { $cond: [{ $eq: ["$status", "rescheduled"] }, 1, 0] },
          },
        },
      },
    ]);

    // Average appointments per day
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalAppointments = completionStats[0]?.total || 0;
    const avgAppointmentsPerDay =
      totalDays > 0 ? totalAppointments / totalDays : 0;

    // Reschedule analysis
    const rescheduleAnalysis = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          "rescheduleHistory.0": { $exists: true },
        },
      },
      {
        $project: {
          rescheduleCount: { $size: "$rescheduleHistory" },
          status: 1,
        },
      },
      {
        $group: {
          _id: null,
          totalRescheduled: { $sum: 1 },
          avgRescheduleCount: { $avg: "$rescheduleCount" },
          maxRescheduleCount: { $max: "$rescheduleCount" },
        },
      },
    ]);

    const stats = completionStats[0] || {
      total: 0,
      completed: 0,
      cancelled: 0,
      scheduled: 0,
      confirmed: 0,
      rescheduled: 0,
    };

    const completionRate =
      stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
    const cancellationRate =
      stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalAppointments: stats.total,
          completedAppointments: stats.completed,
          cancelledAppointments: stats.cancelled,
          scheduledAppointments: stats.scheduled,
          confirmedAppointments: stats.confirmed,
          rescheduledAppointments: stats.rescheduled,
          completionRate: Math.round(completionRate * 100) / 100,
          cancellationRate: Math.round(cancellationRate * 100) / 100,
          avgAppointmentsPerDay: Math.round(avgAppointmentsPerDay * 100) / 100,
        },
        statusDistribution,
        dailyTrends,
        timeSlotPopularity,
        rescheduleAnalysis: rescheduleAnalysis[0] || {
          totalRescheduled: 0,
          avgRescheduleCount: 0,
          maxRescheduleCount: 0,
        },
        dateRange: {
          startDate: start,
          endDate: end,
        },
      },
    });
  } catch (error) {
    console.error("Get admin appointment analytics error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get revenue analytics for admin
 * @route   GET /api/admin/analytics/revenue
 * @access  Private (Admin)
 */
export const getAdminRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "month" } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Total revenue overview
    const revenueOverview = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          transactionDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: "$amount" },
          minTransaction: { $min: "$amount" },
          maxTransaction: { $max: "$amount" },
        },
      },
    ]);

    // Revenue trends based on groupBy parameter
    let groupByStage = {};
    if (groupBy === "day") {
      groupByStage = {
        year: { $year: "$transactionDate" },
        month: { $month: "$transactionDate" },
        day: { $dayOfMonth: "$transactionDate" },
      };
    } else if (groupBy === "week") {
      groupByStage = {
        year: { $year: "$transactionDate" },
        week: { $week: "$transactionDate" },
      };
    } else {
      groupByStage = {
        year: { $year: "$transactionDate" },
        month: { $month: "$transactionDate" },
      };
    }

    const revenueTrends = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          transactionDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: groupByStage,
          revenue: { $sum: "$amount" },
          transactions: { $sum: 1 },
          avgTransaction: { $avg: "$amount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 },
      },
    ]);

    // Revenue by plan
    const revenueByPlan = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          transactionDate: { $gte: start, $lte: end },
        },
      },
      {
        $lookup: {
          from: "plans",
          localField: "planId",
          foreignField: "_id",
          as: "plan",
        },
      },
      {
        $unwind: "$plan",
      },
      {
        $group: {
          _id: {
            planId: "$plan._id",
            planName: "$plan.name",
            planPrice: "$plan.price",
          },
          totalRevenue: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: "$amount" },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
    ]);

    // Payment method distribution
    const paymentMethodDistribution = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          transactionDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          avgAmount: { $avg: "$amount" },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);

    // Failed payments analysis
    const failedPayments = await Payment.aggregate([
      {
        $match: {
          status: "failed",
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          potentialRevenueLoss: { $sum: "$amount" },
        },
      },
    ]);

    // Revenue growth comparison (current period vs previous period)
    const periodDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(
      start.getTime() - periodDays * 24 * 60 * 60 * 1000
    );
    const previousEnd = start;

    const previousRevenue = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          transactionDate: { $gte: previousStart, $lte: previousEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    const currentRevenue = revenueOverview[0]?.totalRevenue || 0;
    const prevRevenue = previousRevenue[0]?.totalRevenue || 0;
    const revenueGrowth =
      prevRevenue > 0
        ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
        : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          ...(revenueOverview[0] || {
            totalRevenue: 0,
            totalTransactions: 0,
            averageTransaction: 0,
            minTransaction: 0,
            maxTransaction: 0,
          }),
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        },
        trends: revenueTrends,
        revenueByPlan,
        paymentMethodDistribution,
        failedPayments: failedPayments[0] || {
          count: 0,
          potentialRevenueLoss: 0,
        },
        dateRange: {
          startDate: start,
          endDate: end,
        },
      },
    });
  } catch (error) {
    console.error("Get admin revenue analytics error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get patient analytics for admin
 * @route   GET /api/admin/analytics/patients
 * @access  Private (Admin)
 */
export const getAdminPatientAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Patient growth metrics
    const patientGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          newPatients: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Patient demographics
    const demographics = await User.aggregate([
      {
        $group: {
          _id: "$gender",
          count: { $sum: 1 },
        },
      },
    ]);

    // Subscription status distribution
    const subscriptionDistribution = await User.aggregate([
      {
        $group: {
          _id: "$subscription.status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Plan popularity
    const planPopularity = await User.aggregate([
      {
        $match: {
          "subscription.planId": { $exists: true },
        },
      },
      {
        $lookup: {
          from: "plans",
          localField: "subscription.planId",
          foreignField: "_id",
          as: "plan",
        },
      },
      {
        $unwind: "$plan",
      },
      {
        $group: {
          _id: {
            planId: "$plan._id",
            planName: "$plan.name",
          },
          activeSubscriptions: {
            $sum: {
              $cond: [{ $eq: ["$subscription.status", "active"] }, 1, 0],
            },
          },
          totalSubscriptions: { $sum: 1 },
          avgSessionsRemaining: { $avg: "$subscription.sessionsRemaining" },
        },
      },
      {
        $sort: { totalSubscriptions: -1 },
      },
    ]);

    // Patient engagement metrics
    const engagementMetrics = await User.aggregate([
      {
        $lookup: {
          from: "appointments",
          localField: "_id",
          foreignField: "userId",
          as: "appointments",
        },
      },
      {
      },
      {
        $project: {
          appointmentCount: { $size: "$appointments" },
          subscriptionStatus: "$subscription.status",
          sessionsRemaining: "$subscription.sessionsRemaining",
          hasActiveSubscription: { $eq: ["$subscription.status", "active"] },
        },
      },
      {
        $group: {
          _id: null,
          totalPatients: { $sum: 1 },
          activePatients: { $sum: { $cond: ["$hasActiveSubscription", 1, 0] } },
          avgAppointmentsPerPatient: { $avg: "$appointmentCount" },
          patientsWithAppointments: {
            $sum: { $cond: [{ $gt: ["$appointmentCount", 0] }, 1, 0] },
          },
        },
      },
    ]);

    // Patient retention analysis
    const retentionAnalysis = await User.aggregate([
      {
        $lookup: {
          from: "appointments",
          localField: "_id",
          foreignField: "userId",
          as: "appointments",
        },
      },
      {
        $project: {
          createdAt: 1,
          lastAppointment: { $max: "$appointments.date" },
          appointmentCount: { $size: "$appointments" },
        },
      },
      {
        $project: {
          createdAt: 1,
          lastAppointment: 1,
          appointmentCount: 1,
          daysSinceLastAppointment: {
            $cond: [
              { $ne: ["$lastAppointment", null] },
              {
                $divide: [
                  { $subtract: [new Date(), "$lastAppointment"] },
                  1000 * 60 * 60 * 24,
                ],
              },
              null,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          newPatients: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    "$createdAt",
                    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  ],
                },
                1,
                0,
              ],
            },
          },
          returningPatients: {
            $sum: { $cond: [{ $gt: ["$appointmentCount", 1] }, 1, 0] },
          },
          recentlyActivePatients: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$daysSinceLastAppointment", null] },
                    { $lte: ["$daysSinceLastAppointment", 30] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          inactivePatients: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$daysSinceLastAppointment", null] },
                    { $gt: ["$daysSinceLastAppointment", 90] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // Calculate growth rate
    const periodDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(
      start.getTime() - periodDays * 24 * 60 * 60 * 1000
    );
    const previousEnd = start;

    const previousPatientCount = await User.countDocuments({
      createdAt: { $gte: previousStart, $lte: previousEnd },
    });

    const currentPatientCount = await User.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });

    const growthRate =
      previousPatientCount > 0
        ? ((currentPatientCount - previousPatientCount) /
            previousPatientCount) *
          100
        : 0;

    const engagement = engagementMetrics[0] || {
      totalPatients: 0,
      activePatients: 0,
      avgAppointmentsPerPatient: 0,
      patientsWithAppointments: 0,
    };

    const retention = retentionAnalysis[0] || {
      newPatients: 0,
      returningPatients: 0,
      recentlyActivePatients: 0,
      inactivePatients: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalPatients: engagement.totalPatients,
          activePatients: engagement.activePatients,
          newPatients: currentPatientCount,
          growthRate: Math.round(growthRate * 100) / 100,
          engagementRate:
            engagement.totalPatients > 0
              ? Math.round(
                  (engagement.patientsWithAppointments /
                    engagement.totalPatients) *
                    10000
                ) / 100
              : 0,
        },
        growth: patientGrowth,
        demographics,
        subscriptionDistribution,
        planPopularity,
        engagement,
        retention,
        dateRange: {
          startDate: start,
          endDate: end,
        },
      },
    });
  } catch (error) {
    console.error("Get admin patient analytics error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Generate custom report for admin
 * @route   POST /api/admin/reports/generate
 * @access  Private (Admin)
 */
export const generateAdminReport = async (req, res) => {
  try {
    const {
      reportType,
      startDate,
      endDate,
      filters = {},
      groupBy = "day",
      metrics = [],
      format = "json",
    } = req.body;

    if (!reportType || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Report type, start date, and end date are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    let reportData = {};

    switch (reportType) {
      case "appointments":
        reportData = await generateAppointmentReport(
          start,
          end,
          filters,
          groupBy,
          metrics
        );
        break;
      case "revenue":
        reportData = await generateRevenueReport(
          start,
          end,
          filters,
          groupBy,
          metrics
        );
        break;
      case "patients":
        reportData = await generatePatientReport(
          start,
          end,
          filters,
          groupBy,
          metrics
        );
        break;
      case "comprehensive":
        reportData = await generateComprehensiveReport(
          start,
          end,
          filters,
          groupBy,
          metrics
        );
        break;
      default:
        return res.status(400).json({
          success: false,
          message:
            "Invalid report type. Supported types: appointments, revenue, patients, comprehensive",
        });
    }

    const report = {
      reportId: `report_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      reportType,
      generatedAt: new Date(),
      dateRange: { startDate: start, endDate: end },
      filters,
      groupBy,
      metrics,
      format,
      data: reportData,
    };

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Generate admin report error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get comprehensive dashboard analytics
 * @route   GET /api/analytics/dashboard
 * @access  Private (Admin)
 */
export const getDashboardAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get basic counts
    const [
      totalUsers,
      activeSubscriptions,
      totalAppointments,
      totalRevenue,
      todayAppointments,
      upcomingAppointments,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ "subscription.status": "active" }),
      Appointment.countDocuments({ date: { $gte: start, $lte: end } }),
      Payment.aggregate([
        {
          $match: {
            status: "completed",
            transactionDate: { $gte: start, $lte: end },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Appointment.countDocuments({
        date: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lte: new Date().setHours(23, 59, 59, 999),
        },
      }),
      Appointment.countDocuments({
        date: { $gte: new Date() },
        status: { $in: ["scheduled", "confirmed"] },
      }),
    ]);

    // Get growth metrics (compared to previous period)
    const periodDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(
      start.getTime() - periodDays * 24 * 60 * 60 * 1000
    );
    const previousEnd = start;

    const [
      previousUsers,
      previousAppointments,
      previousRevenue,
    ] = await Promise.all([
      User.countDocuments({
        createdAt: { $gte: previousStart, $lte: previousEnd },
      }),
      Appointment.countDocuments({
        date: { $gte: previousStart, $lte: previousEnd },
      }),
      Payment.aggregate([
        {
          $match: {
            status: "completed",
            transactionDate: { $gte: previousStart, $lte: previousEnd },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const currentUsers = await User.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });
    const currentRevenue = totalRevenue[0]?.total || 0;
    const prevRevenue = previousRevenue[0]?.total || 0;

    // Calculate growth percentages
    const userGrowth =
      previousUsers > 0
        ? ((currentUsers - previousUsers) / previousUsers) * 100
        : 0;
    const appointmentGrowth =
      previousAppointments > 0
        ? ((totalAppointments - previousAppointments) / previousAppointments) *
          100
        : 0;
    const revenueGrowth =
      prevRevenue > 0
        ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
        : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeSubscriptions,
          totalAppointments,
          totalRevenue: currentRevenue,
          todayAppointments,
          upcomingAppointments,
        },
        growth: {
          userGrowth: Math.round(userGrowth * 100) / 100,
          appointmentGrowth: Math.round(appointmentGrowth * 100) / 100,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        },
        dateRange: {
          startDate: start,
          endDate: end,
        },
      },
    });
  } catch (error) {
    console.error("Get dashboard analytics error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get revenue analytics
 * @route   GET /api/analytics/revenue
 * @access  Private (Admin)
 */
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "month" } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get total revenue analytics
    const revenueAnalytics = await Payment.getRevenueAnalytics(start, end);

    // Get monthly revenue trends
    const monthlyRevenue = await Payment.getMonthlyRevenue(
      new Date().getFullYear()
    );

    // Get revenue by plan
    const revenueByPlan = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          transactionDate: { $gte: start, $lte: end },
        },
      },
      {
        $lookup: {
          from: "plans",
          localField: "planId",
          foreignField: "_id",
          as: "plan",
        },
      },
      {
        $unwind: "$plan",
      },
      {
        $group: {
          _id: "$plan.name",
          totalRevenue: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: "$amount" },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
    ]);

    // Get payment method distribution
    const paymentMethods = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          transactionDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: revenueAnalytics,
        monthlyTrends: monthlyRevenue,
        revenueByPlan,
        paymentMethods,
        dateRange: {
          startDate: start,
          endDate: end,
        },
      },
    });
  } catch (error) {
    console.error("Get revenue analytics error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get appointment analytics
 * @route   GET /api/analytics/appointments
 * @access  Private (Admin)
 */
export const getAppointmentAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Appointment status distribution
    const statusDistribution = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Daily appointment trends
    const dailyTrends = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" },
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);

    // Time slot popularity
    const timeSlotPopularity = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: "$timeSlot",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Appointment completion rate
    const completionStats = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          noShow: {
            $sum: { $cond: [{ $eq: ["$status", "no_show"] }, 1, 0] },
          },
        },
      },
    ]);

    const completionRate = completionStats[0]
      ? (completionStats[0].completed / completionStats[0].total) * 100
      : 0;

    res.status(200).json({
      success: true,
      data: {
        statusDistribution,
        dailyTrends,
        timeSlotPopularity,
        completionRate: Math.round(completionRate * 100) / 100,
        completionStats: completionStats[0] || {
          total: 0,
          completed: 0,
          cancelled: 0,
          noShow: 0,
        },
        dateRange: {
          startDate: start,
          endDate: end,
        },
      },
    });
  } catch (error) {
    console.error("Get appointment analytics error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * @desc    Get user analytics
 * @route   GET /api/analytics/users
 * @access  Private (Admin)
 */
export const getUserAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // User registration trends
    const registrationTrends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);

    // Subscription plan distribution
    const planDistribution = await User.aggregate([
      {
        $lookup: {
          from: "plans",
          localField: "subscription.planId",
          foreignField: "_id",
          as: "plan",
        },
      },
      {
        $unwind: "$plan",
      },
      {
        $group: {
          _id: "$plan.name",
          count: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [{ $eq: ["$subscription.status", "active"] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // User engagement metrics
    const engagementMetrics = await User.aggregate([
      {
        $lookup: {
          from: "appointments",
          localField: "_id",
          foreignField: "userId",
          as: "appointments",
        },
      },
      {
      },
      {
        $project: {
          appointmentCount: { $size: "$appointments" },
          subscriptionStatus: "$subscription.status",
        },
      },
      {
        $group: {
          _id: null,
          avgAppointments: { $avg: "$appointmentCount" },
          activeUsers: {
            $sum: { $cond: [{ $eq: ["$subscriptionStatus", "active"] }, 1, 0] },
          },
          totalUsers: { $sum: 1 },
        },
      },
    ]);

    // Geographic distribution (if address data is available)
    const geographicDistribution = await User.aggregate([
      {
        $match: {
          address: { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: { $substr: ["$address", 0, 20] }, // First 20 characters as location indicator
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        registrationTrends,
        planDistribution,
        engagementMetrics: engagementMetrics[0] || {
          avgAppointments: 0,
          activeUsers: 0,
          totalUsers: 0,
        },
        geographicDistribution,
        dateRange: {
          startDate: start,
          endDate: end,
        },
      },
    });
  } catch (error) {
    console.error("Get user analytics error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Generate custom report
 * @route   POST /api/analytics/custom-report
 * @access  Private (Admin)
 */
export const generateCustomReport = async (req, res) => {
  try {
    const {
      reportType,
      startDate,
      endDate,
      filters = {},
      groupBy = "day",
      metrics = [],
    } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    let reportData = {};

    switch (reportType) {
      case "revenue":
        reportData = await generateRevenueReport(start, end, filters, groupBy);
        break;
      case "appointments":
        reportData = await generateAppointmentReport(
          start,
          end,
          filters,
          groupBy
        );
        break;
      case "users":
        reportData = await generateUserReport(start, end, filters, groupBy);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid report type",
        });
    }

    res.status(200).json({
      success: true,
      data: {
        reportType,
        dateRange: { startDate: start, endDate: end },
        filters,
        groupBy,
        metrics,
        ...reportData,
      },
    });
  } catch (error) {
    console.error("Generate custom report error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper functions for custom reports
const generateAppointmentReport = async (
  start,
  end,
  filters,
  groupBy,
  metrics
) => {
  const matchStage = {
    date: { $gte: start, $lte: end },
  };

  // Apply filters
  if (filters.status) {
    matchStage.status = filters.status;
  }
  if (filters.userId) {
    matchStage.userId = new mongoose.Types.ObjectId(filters.userId);
  }

  // Get detailed appointment data
  const appointments = await Appointment.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $project: {
        date: 1,
        timeSlot: 1,
        status: 1,
        notes: 1,
        createdAt: 1,
        "user.name": 1,
        "user.phone": 1,
        "user.email": 1,
        rescheduleCount: { $size: { $ifNull: ["$rescheduleHistory", []] } },
      },
    },
    {
      $sort: { date: -1 },
    },
  ]);

  // Generate summary statistics
  const summary = await Appointment.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalAppointments: { $sum: 1 },
        completedAppointments: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        cancelledAppointments: {
          $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
        },
        rescheduledAppointments: {
          $sum: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$rescheduleHistory", []] } }, 0] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  return {
    appointments,
    summary: summary[0] || {
      totalAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      rescheduledAppointments: 0,
    },
  };
};

const generateRevenueReport = async (start, end, filters, groupBy, metrics) => {
  const matchStage = {
    status: "completed",
    transactionDate: { $gte: start, $lte: end },
  };

  // Apply filters
  if (filters.planId) {
    matchStage.planId = new mongoose.Types.ObjectId(filters.planId);
  }
  if (filters.paymentMethod) {
    matchStage.paymentMethod = filters.paymentMethod;
  }

  // Get detailed payment data
  const payments = await Payment.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $lookup: {
        from: "plans",
        localField: "planId",
        foreignField: "_id",
        as: "plan",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $unwind: "$plan",
    },
    {
      $project: {
        amount: 1,
        currency: 1,
        paymentMethod: 1,
        transactionDate: 1,
        razorpayPaymentId: 1,
        "user.name": 1,
        "user.phone": 1,
        "user.email": 1,
        "plan.name": 1,
        "plan.price": 1,
      },
    },
    {
      $sort: { transactionDate: -1 },
    },
  ]);

  // Generate revenue summary
  const summary = await Payment.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" },
        totalTransactions: { $sum: 1 },
        averageTransaction: { $avg: "$amount" },
        minTransaction: { $min: "$amount" },
        maxTransaction: { $max: "$amount" },
      },
    },
  ]);

  return {
    payments,
    summary: summary[0] || {
      totalRevenue: 0,
      totalTransactions: 0,
      averageTransaction: 0,
      minTransaction: 0,
      maxTransaction: 0,
    },
  };
};

const generatePatientReport = async (start, end, filters, groupBy, metrics) => {
  const matchStage = {
    createdAt: { $gte: start, $lte: end },
  };

  // Apply filters
  if (filters.subscriptionStatus) {
    matchStage["subscription.status"] = filters.subscriptionStatus;
  }
  if (filters.gender) {
    matchStage.gender = filters.gender;
  }

  // Get detailed patient data
  const patients = await User.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "appointments",
        localField: "_id",
        foreignField: "userId",
        as: "appointments",
      },
    },
    {
      $lookup: {
        from: "payments",
        localField: "_id",
        foreignField: "userId",
        as: "payments",
      },
    },
    {
      $lookup: {
        from: "plans",
        localField: "subscription.planId",
        foreignField: "_id",
        as: "plan",
      },
    },
    {
      $project: {
        name: 1,
        phone: 1,
        email: 1,
        gender: 1,
        address: 1,
        createdAt: 1,
        "subscription.status": 1,
        "subscription.startDate": 1,
        "subscription.endDate": 1,
        planName: { $arrayElemAt: ["$plan.name", 0] },
        totalAppointments: { $size: "$appointments" },
        completedAppointments: {
          $size: {
            $filter: {
              input: "$appointments",
              cond: { $eq: ["$$this.status", "completed"] },
            },
          },
        },
        totalPayments: {
          $size: {
            $filter: {
              input: "$payments",
              cond: { $eq: ["$$this.status", "completed"] },
            },
          },
        },
        totalSpent: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: "$payments",
                  cond: { $eq: ["$$this.status", "completed"] },
                },
              },
              as: "payment",
              in: "$$payment.amount",
            },
          },
        },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  // Generate patient summary
  const summary = await User.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalPatients: { $sum: 1 },
        activeSubscriptions: {
          $sum: { $cond: [{ $eq: ["$subscription.status", "active"] }, 1, 0] },
        },
        malePatients: {
          $sum: { $cond: [{ $eq: ["$gender", "male"] }, 1, 0] },
        },
        femalePatients: {
          $sum: { $cond: [{ $eq: ["$gender", "female"] }, 1, 0] },
        },
      },
    },
  ]);

  return {
    patients,
    summary: summary[0] || {
      totalPatients: 0,
      activeSubscriptions: 0,
      malePatients: 0,
      femalePatients: 0,
    },
  };
};

const generateComprehensiveReport = async (
  start,
  end,
  filters,
  groupBy,
  metrics
) => {
  // Generate all report types
  const [appointmentData, revenueData, patientData] = await Promise.all([
    generateAppointmentReport(start, end, filters, groupBy, metrics),
    generateRevenueReport(start, end, filters, groupBy, metrics),
    generatePatientReport(start, end, filters, groupBy, metrics),
  ]);

  // Generate cross-metric insights
  const insights = {
    revenuePerAppointment:
      appointmentData.summary.completedAppointments > 0
        ? revenueData.summary.totalRevenue /
          appointmentData.summary.completedAppointments
        : 0,
    appointmentsPerPatient:
      patientData.summary.totalPatients > 0
        ? appointmentData.summary.totalAppointments /
          patientData.summary.totalPatients
        : 0,
    revenuePerPatient:
      patientData.summary.totalPatients > 0
        ? revenueData.summary.totalRevenue / patientData.summary.totalPatients
        : 0,
  };

  return {
    appointments: appointmentData,
    revenue: revenueData,
    patients: patientData,
    insights,
  };
};
