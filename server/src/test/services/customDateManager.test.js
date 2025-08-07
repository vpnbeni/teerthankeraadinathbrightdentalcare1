import { jest } from "@jest/globals";
import CustomDateManager from "../../services/customDateManager.js";
import CustomDateAvailability from "../../models/CustomDateAvailability.js";
import Holiday from "../../models/Holiday.js";
import Appointment from "../../models/Appointment.js";
import { auditService } from "../../services/auditService.js";
import { ValidationError } from "../../utils/errors.js";

// Mock dependencies
jest.mock("../../models/CustomDateAvailability.js");
jest.mock("../../models/Holiday.js");
jest.mock("../../models/Appointment.js");
jest.mock("../../services/auditService.js");

describe("CustomDateManager", () => {
  let customDateManager;
  let mockUserId;
  let mockAuditInfo;

  beforeEach(() => {
    customDateManager = new CustomDateManager();
    mockUserId = "user123";
    mockAuditInfo = {
      ipAddress: "127.0.0.1",
      userAgent: "test-agent",
      endpoint: "/test",
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("getCustomDates", () => {
    it("should retrieve custom dates with default options", async () => {
      const mockCustomDates = [
        {
          _id: "custom1",
          date: new Date("2024-03-15"),
          reason: "Extended hours",
          customSlots: [{ startTime: "08:00", endTime: "09:00" }],
        },
      ];

      CustomDateAvailability.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockCustomDates),
              }),
            }),
          }),
        }),
      });

      Cu