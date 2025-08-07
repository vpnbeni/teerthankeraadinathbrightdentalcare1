import mongoose from "mongoose";
import { encryptionService } from "../services/encryptionService.js";
import { auditService } from "../services/auditService.js";

const sessionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: [true, "Appointment ID is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    // Dental Examination Details
    examination: {
      teethPresent: {
        type: Number,
        min: [0, "Teeth present cannot be negative"],
        max: [32, "Teeth present cannot exceed 32"],
      },
      cariesStatus: {
        type: String,
        trim: true,
        maxlength: [500, "Caries status cannot exceed 500 characters"],
      },
      attritionAbrasion: {
        type: String,
        trim: true,
        maxlength: [
          500,
          "Attrition/Abrasion details cannot exceed 500 characters",
        ],
      },
      missingTeeth: [
        {
          type: Number,
          min: [1, "Tooth number must be between 1 and 32"],
          max: [32, "Tooth number must be between 1 and 32"],
        },
      ],
      previousTreatments: [
        {
          type: String,
          trim: true,
          maxlength: [
            200,
            "Treatment description cannot exceed 200 characters",
          ],
        },
      ],
      cappingStatus: {
        type: String,
        trim: true,
        maxlength: [500, "Capping status cannot exceed 500 characters"],
      },
      sinusIssues: {
        type: String,
        trim: true,
        maxlength: [500, "Sinus issues cannot exceed 500 characters"],
      },
      lesions: {
        type: String,
        trim: true,
        maxlength: [500, "Lesions description cannot exceed 500 characters"],
      },
      tmjProblems: {
        type: String,
        trim: true,
        maxlength: [500, "TMJ problems cannot exceed 500 characters"],
      },
      stainsCalculus: {
        type: String,
        trim: true,
        maxlength: [
          500,
          "Stains/Calculus details cannot exceed 500 characters",
        ],
      },
      gumIssues: {
        type: String,
        trim: true,
        maxlength: [500, "Gum issues cannot exceed 500 characters"],
      },
      customFields: [
        {
          fieldName: {
            type: String,
            required: [true, "Custom field name is required"],
            trim: true,
            maxlength: [100, "Field name cannot exceed 100 characters"],
          },
          fieldValue: {
            type: String,
            required: [true, "Custom field value is required"],
            trim: true,
            maxlength: [1000, "Field value cannot exceed 1000 characters"],
          },
        },
      ],
    },

    // Session Metadata
    completedAt: {
      type: Date,
      default: Date.now,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Completed by user ID is required"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Notes cannot exceed 2000 characters"],
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
sessionSchema.index({ appointmentId: 1 });
sessionSchema.index({ userId: 1 });
sessionSchema.index({ completedBy: 1 });
sessionSchema.index({ completedAt: -1 });
sessionSchema.index({ userId: 1, completedAt: -1 }); // Compound index for user sessions

// Virtual for session duration (if needed)
sessionSchema.virtual("sessionDuration").get(function () {
  if (this.completedAt && this.createdAt) {
    return Math.round((this.completedAt - this.createdAt) / (1000 * 60)); // Duration in minutes
  }
  return 0;
});

// Virtual to check if session has custom fields
sessionSchema.virtual("hasCustomFields").get(function () {
  return (
    this.examination.customFields && this.examination.customFields.length > 0
  );
});

// Virtual for total missing teeth count
sessionSchema.virtual("totalMissingTeeth").get(function () {
  return this.examination.missingTeeth
    ? this.examination.missingTeeth.length
    : 0;
});

// Ensure virtual fields are serialized
sessionSchema.set("toJSON", {
  virtuals: true,
});

// Static method to get user sessions
sessionSchema.statics.getUserSessions = function (userId) {
  return this.find({ userId })
    .populate("appointmentId", "date timeSlot status")
    .populate("userId", "name phone email")
    .populate("completedBy", "name role")
    .sort({ completedAt: -1 });
};

// Static method to get sessions by date range
sessionSchema.statics.getSessionsByDateRange = function (startDate, endDate) {
  return this.find({
    completedAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  })
    .populate("appointmentId", "date timeSlot status")
    .populate("userId", "name phone email")
    .populate("completedBy", "name role")
    .sort({ completedAt: -1 });
};

// Static method to get session statistics
sessionSchema.statics.getSessionStatistics = async function (
  startDate,
  endDate
) {
  const pipeline = [
    {
      $match: {
        completedAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        averageTeethPresent: { $avg: "$examination.teethPresent" },
        totalMissingTeeth: {
          $sum: { $size: { $ifNull: ["$examination.missingTeeth", []] } },
        },
        sessionsWithCustomFields: {
          $sum: {
            $cond: [
              {
                $gt: [
                  { $size: { $ifNull: ["$examination.customFields", []] } },
                  0,
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ];

  const result = await this.aggregate(pipeline);
  return (
    result[0] || {
      totalSessions: 0,
      averageTeethPresent: 0,
      totalMissingTeeth: 0,
      sessionsWithCustomFields: 0,
    }
  );
};

// Static method to get monthly session completion trends
sessionSchema.statics.getMonthlySessionTrends = async function (year) {
  const pipeline = [
    {
      $match: {
        completedAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$completedAt" },
        sessionCount: { $sum: 1 },
        averageTeethPresent: { $avg: "$examination.teethPresent" },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ];

  return this.aggregate(pipeline);
};

// Static method to find sessions with specific conditions
sessionSchema.statics.findSessionsWithCondition = function (condition) {
  const query = {};

  if (condition.minTeethPresent) {
    query["examination.teethPresent"] = { $gte: condition.minTeethPresent };
  }

  if (condition.maxTeethPresent) {
    query["examination.teethPresent"] = {
      ...query["examination.teethPresent"],
      $lte: condition.maxTeethPresent,
    };
  }

  if (condition.hasCaries) {
    query["examination.cariesStatus"] = { $exists: true, $ne: "" };
  }

  if (condition.hasCustomFields) {
    query["examination.customFields.0"] = { $exists: true };
  }

  return this.find(query)
    .populate("appointmentId", "date timeSlot")
    .populate("userId", "name phone email")
    .populate("completedBy", "name role")
    .sort({ completedAt: -1 });
};

// Instance method to add custom field
sessionSchema.methods.addCustomField = function (fieldName, fieldValue) {
  if (!this.examination.customFields) {
    this.examination.customFields = [];
  }

  // Check if field already exists
  const existingFieldIndex = this.examination.customFields.findIndex(
    (field) => field.fieldName === fieldName
  );

  if (existingFieldIndex !== -1) {
    // Update existing field
    this.examination.customFields[existingFieldIndex].fieldValue = fieldValue;
  } else {
    // Add new field
    this.examination.customFields.push({ fieldName, fieldValue });
  }

  return this.save();
};

// Instance method to remove custom field
sessionSchema.methods.removeCustomField = function (fieldName) {
  if (this.examination.customFields) {
    this.examination.customFields = this.examination.customFields.filter(
      (field) => field.fieldName !== fieldName
    );
  }

  return this.save();
};

// Instance method to update examination data
sessionSchema.methods.updateExamination = function (examinationData) {
  Object.keys(examinationData).forEach((key) => {
    if (examinationData[key] !== undefined) {
      this.examination[key] = examinationData[key];
    }
  });

  return this.save();
};

// Pre-save middleware to validate missing teeth numbers
sessionSchema.pre("save", function (next) {
  if (this.examination.missingTeeth) {
    const invalidTeeth = this.examination.missingTeeth.filter(
      (tooth) => tooth < 1 || tooth > 32
    );

    if (invalidTeeth.length > 0) {
      return next(
        new Error(
          `Invalid tooth numbers: ${invalidTeeth.join(
            ", "
          )}. Tooth numbers must be between 1 and 32.`
        )
      );
    }

    // Remove duplicates
    this.examination.missingTeeth = [...new Set(this.examination.missingTeeth)];
  }

  next();
});

// Pre-save middleware to encrypt examination data and validate
sessionSchema.pre("save", async function (next) {
  try {
    // Encrypt examination data if modified
    if (this.isModified("examination") && this.examination) {
      this.examination = encryptionService.encryptExaminationData(
        this.examination
      );
    }

    // Validation for new sessions
    if (this.isNew) {
      const Appointment = mongoose.model("Appointment");
      const appointment = await Appointment.findById(this.appointmentId);

      if (!appointment) {
        return next(new Error("Appointment not found"));
      }

      if (appointment.userId.toString() !== this.userId.toString()) {
        return next(
          new Error("Appointment does not belong to the specified user")
        );
      }

      // Check if session already exists for this appointment
      const existingSession = await this.constructor.findOne({
        appointmentId: this.appointmentId,
      });

      if (existingSession) {
        return next(new Error("Session already exists for this appointment"));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Post-find middleware to decrypt examination data
sessionSchema.post(
  ["find", "findOne", "findOneAndUpdate"],
  async function (docs) {
    if (!docs) return;

    const documents = Array.isArray(docs) ? docs : [docs];

    for (const doc of documents) {
      if (doc && doc.examination) {
        try {
          doc.examination = encryptionService.decryptExaminationData(
            doc.examination
          );
        } catch (error) {
          console.error("Failed to decrypt examination data:", error);
        }
      }
    }
  }
);

// Audit logging middleware
sessionSchema.post("save", async function (doc) {
  try {
    const action = this.isNew ? "CREATE" : "UPDATE";
    await auditService.logMedicalAccess(
      doc.completedBy,
      "admin",
      doc.userId,
      action,
      `Session ${action.toLowerCase()}d with examination data`,
      "system"
    );
  } catch (error) {
    console.error("Failed to log session audit:", error);
  }
});

sessionSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    try {
      await auditService.logMedicalAccess(
        "system",
        "system",
        doc.userId,
        "DELETE",
        "Session deleted",
        "system"
      );
    } catch (error) {
      console.error("Failed to log session deletion audit:", error);
    }
  }
});

const Session = mongoose.model("Session", sessionSchema);

export default Session;
