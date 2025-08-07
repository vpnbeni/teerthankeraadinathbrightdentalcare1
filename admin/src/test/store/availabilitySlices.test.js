import { describe, it, expect, beforeEach, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import availabilityTemplateSlice, {
  fetchAvailabilityTemplate,
  updateAvailabilityTemplate,
  addTemplateSlot,
  removeTemplateSlot,
  clearError,
  optimisticAddSlot,
  toggleSlotActive,
} from "../../store/availabilityTemplateSlice";
import holidaySlice, {
  fetchHolidays,
  addHoliday,
  updateHoliday,
  deleteHoliday,
  bulkAddHolidays,
  setFilters,
  optimisticAddHoliday,
  sortHolidays,
} from "../../store/holidaySlice";
import customDateSlice, {
  fetchCustomDates,
  addCustomDate,
  updateCustomDate,
  deleteCustomDate,
  bulkAddCustomDates,
  setPreviewDate,
  optimisticAddCustomDate,
  addSlotToCustomDate,
} from "../../store/customDateSlice";

// Mock the availability service
vi.mock("../../services/availability", () => ({
  default: {
    getAvailabilityTemplate: vi.fn(),
    updateAvailabilityTemplate: vi.fn(),
    addTemplateSlot: vi.fn(),
    removeTemplateSlot: vi.fn(),
    getHolidays: vi.fn(),
    addHoliday: vi.fn(),
    updateHoliday: vi.fn(),
    deleteHoliday: vi.fn(),
    bulkAddHolidays: vi.fn(),
    getCustomDates: vi.fn(),
    addCustomDate: vi.fn(),
    updateCustomDate: vi.fn(),
    deleteCustomDate: vi.fn(),
    bulkAddCustomDates: vi.fn(),
  },
}));

// Mock toast
vi.mock("../../shared/utils/toast", () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Availability Redux Slices", () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        availabilityTemplate: availabilityTemplateSlice,
        holidays: holidaySlice,
        customDates: customDateSlice,
      },
    });
  });

  describe("availabilityTemplateSlice", () => {
    it("should have correct initial state", () => {
      const state = store.getState().availabilityTemplate;
      expect(state.template.defaultSlots).toEqual([]);
      expect(state.template.workingDays).toEqual([1, 2, 3, 4, 5, 6]);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });

    it("should handle clearError action", () => {
      // Set an error first
      store.dispatch({ type: "availabilityTemplate/clearError" });
      const state = store.getState().availabilityTemplate;
      expect(state.error).toBe(null);
    });

    it("should handle optimisticAddSlot action", () => {
      const slotData = {
        startTime: "09:00",
        endTime: "10:00",
        isActive: true,
      };

      store.dispatch(optimisticAddSlot(slotData));
      const state = store.getState().availabilityTemplate;

      expect(state.template.defaultSlots).toHaveLength(1);
      expect(state.template.defaultSlots[0].startTime).toBe("09:00");
      expect(state.template.defaultSlots[0].isOptimistic).toBe(true);
      expect(state.pendingSlots).toHaveLength(1);
    });

    it("should handle toggleSlotActive action", () => {
      // First add a slot
      const slotData = {
        startTime: "09:00",
        endTime: "10:00",
        isActive: true,
      };

      store.dispatch(optimisticAddSlot(slotData));

      // Get the generated ID from the state
      const state = store.getState().availabilityTemplate;
      const addedSlot = state.template.defaultSlots[0];

      store.dispatch(toggleSlotActive(addedSlot.id));

      const updatedState = store.getState().availabilityTemplate;
      const slot = updatedState.template.defaultSlots.find(
        (s) => s.id === addedSlot.id
      );
      expect(slot.isActive).toBe(false);
    });
  });

  describe("holidaySlice", () => {
    it("should have correct initial state", () => {
      const state = store.getState().holidays;
      expect(state.holidays).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.viewMode).toBe("calendar");
      expect(state.filters.year).toBe(new Date().getFullYear());
    });

    it("should handle setFilters action", () => {
      const filters = { year: 2024, month: 5 };
      store.dispatch(setFilters(filters));

      const state = store.getState().holidays;
      expect(state.filters.year).toBe(2024);
      expect(state.filters.month).toBe(5);
    });

    it("should handle optimisticAddHoliday action", () => {
      const holidayData = {
        date: "2024-12-25",
        name: "Christmas",
        description: "Christmas Day",
        isRecurring: true,
      };

      store.dispatch(optimisticAddHoliday(holidayData));
      const state = store.getState().holidays;

      expect(state.holidays).toHaveLength(1);
      expect(state.holidays[0].name).toBe("Christmas");
      expect(state.holidays[0].isOptimistic).toBe(true);
      expect(state.pendingHolidays).toHaveLength(1);
    });

    it("should handle sortHolidays action", () => {
      // Add multiple holidays
      const holiday1 = { date: "2024-12-25", name: "Christmas" };
      const holiday2 = { date: "2024-01-01", name: "New Year" };

      store.dispatch(optimisticAddHoliday(holiday1));
      store.dispatch(optimisticAddHoliday(holiday2));
      store.dispatch(sortHolidays("asc"));

      const state = store.getState().holidays;
      expect(new Date(state.holidays[0].date)).toEqual(new Date("2024-01-01"));
      expect(new Date(state.holidays[1].date)).toEqual(new Date("2024-12-25"));
    });
  });

  describe("customDateSlice", () => {
    it("should have correct initial state", () => {
      const state = store.getState().customDates;
      expect(state.customDates).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.viewMode).toBe("calendar");
      expect(state.isPreviewMode).toBe(false);
    });

    it("should handle setPreviewDate action", () => {
      const previewDate = "2024-06-15";
      store.dispatch(setPreviewDate(previewDate));

      const state = store.getState().customDates;
      expect(state.previewDate).toBe(previewDate);
    });

    it("should handle optimisticAddCustomDate action", () => {
      const customDateData = {
        date: "2024-06-15",
        customSlots: [{ startTime: "09:00", endTime: "10:00", isActive: true }],
        reason: "Extended hours",
      };

      store.dispatch(optimisticAddCustomDate(customDateData));
      const state = store.getState().customDates;

      expect(state.customDates).toHaveLength(1);
      expect(state.customDates[0].reason).toBe("Extended hours");
      expect(state.customDates[0].isOptimistic).toBe(true);
      expect(state.pendingCustomDates).toHaveLength(1);
    });

    it("should handle addSlotToCustomDate action", () => {
      // First add a custom date
      const customDateData = {
        date: "2024-06-15",
        customSlots: [],
        reason: "Extended hours",
      };

      store.dispatch(optimisticAddCustomDate(customDateData));

      // Get the generated ID from the state
      const state = store.getState().customDates;
      const addedCustomDate = state.customDates[0];

      // Then add a slot to it
      const slotData = {
        startTime: "19:00",
        endTime: "20:00",
      };

      store.dispatch(
        addSlotToCustomDate({
          customDateId: addedCustomDate._id,
          slot: slotData,
        })
      );

      const updatedState = store.getState().customDates;
      const customDate = updatedState.customDates.find(
        (cd) => cd._id === addedCustomDate._id
      );
      expect(customDate.customSlots).toHaveLength(1);
      expect(customDate.customSlots[0].startTime).toBe("19:00");
      expect(customDate.customSlots[0].isActive).toBe(true);
    });
  });

  describe("Integration between slices", () => {
    it("should maintain separate state for each slice", () => {
      // Add data to each slice
      store.dispatch(
        optimisticAddSlot({
          startTime: "09:00",
          endTime: "10:00",
        })
      );

      store.dispatch(
        optimisticAddHoliday({
          date: "2024-12-25",
          name: "Christmas",
        })
      );

      store.dispatch(
        optimisticAddCustomDate({
          date: "2024-06-15",
          customSlots: [],
          reason: "Extended hours",
        })
      );

      const templateState = store.getState().availabilityTemplate;
      const holidayState = store.getState().holidays;
      const customDateState = store.getState().customDates;

      expect(templateState.template.defaultSlots).toHaveLength(1);
      expect(holidayState.holidays).toHaveLength(1);
      expect(customDateState.customDates).toHaveLength(1);

      // Each slice should maintain its own loading and error state
      expect(templateState.loading).toBe(false);
      expect(holidayState.loading).toBe(false);
      expect(customDateState.loading).toBe(false);
    });
  });
});
