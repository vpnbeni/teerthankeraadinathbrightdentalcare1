import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { availabilityService } from "../services/availability";
import { toast } from "react-hot-toast";

// Query keys for better cache management
export const availabilityKeys = {
  all: ["availability"],
  templates: () => [...availabilityKeys.all, "templates"],
  template: (id) => [...availabilityKeys.templates(), id],
  holidays: () => [...availabilityKeys.all, "holidays"],
  holiday: (id) => [...availabilityKeys.holidays(), id],
  calendar: () => [...availabilityKeys.all, "calendar"],
  calendarMonth: (year, month) => [...availabilityKeys.calendar(), year, month],
  dateRange: (startDate, endDate) => [
    ...availabilityKeys.all,
    "dateRange",
    startDate,
    endDate,
  ],
};

// Templates hooks
export const useTemplates = (filters = {}) => {
  return useQuery({
    queryKey: [...availabilityKeys.templates(), filters],
    queryFn: () => availabilityService.getTemplates(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useTemplate = (templateId) => {
  return useQuery({
    queryKey: availabilityKeys.template(templateId),
    queryFn: () => availabilityService.getTemplate(templateId),
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000,
  });
};

// Holidays hooks
export const useHolidays = (filters = {}) => {
  return useQuery({
    queryKey: [...availabilityKeys.holidays(), filters],
    queryFn: () => availabilityService.getHolidays(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useHoliday = (holidayId) => {
  return useQuery({
    queryKey: availabilityKeys.holiday(holidayId),
    queryFn: () => availabilityService.getHoliday(holidayId),
    enabled: !!holidayId,
    staleTime: 5 * 60 * 1000,
  });
};

// Calendar availability hook with optimized caching
export const useCalendarAvailability = (year, month, options = {}) => {
  const queryClient = useQueryClient();
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const query = useQuery({
    queryKey: availabilityKeys.calendarMonth(year, month),
    queryFn: () =>
      availabilityService.getAvailabilityForDateRange(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      ),
    staleTime: 2 * 60 * 1000, // 2 minutes for calendar data
    cacheTime: 15 * 60 * 1000, // 15 minutes cache
    ...options,
  });

  // Only prefetch adjacent months after the current query is successful and not during initial load
  React.useEffect(() => {
    if (query.isSuccess && !query.isLoading) {
      // Small delay to avoid multiple simultaneous requests
      const timeoutId = setTimeout(() => {
        // Prefetch previous month
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        queryClient.prefetchQuery({
          queryKey: availabilityKeys.calendarMonth(prevYear, prevMonth),
          queryFn: () => {
            const prevStartDate = new Date(prevYear, prevMonth, 1);
            const prevEndDate = new Date(prevYear, prevMonth + 1, 0);
            return availabilityService.getAvailabilityForDateRange(
              prevStartDate.toISOString().split("T")[0],
              prevEndDate.toISOString().split("T")[0]
            );
          },
          staleTime: 2 * 60 * 1000,
        });

        // Prefetch next month
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        queryClient.prefetchQuery({
          queryKey: availabilityKeys.calendarMonth(nextYear, nextMonth),
          queryFn: () => {
            const nextStartDate = new Date(nextYear, nextMonth, 1);
            const nextEndDate = new Date(nextYear, nextMonth + 1, 0);
            return availabilityService.getAvailabilityForDateRange(
              nextStartDate.toISOString().split("T")[0],
              nextEndDate.toISOString().split("T")[0]
            );
          },
          staleTime: 2 * 60 * 1000,
        });
      }, 500); // 500ms delay to avoid rapid-fire requests

      return () => clearTimeout(timeoutId);
    }
  }, [query.isSuccess, query.isLoading, queryClient, year, month]);

  return query;
};

// Simple calendar availability hook without prefetching (for preloading)
export const useCalendarAvailabilitySimple = (year, month, options = {}) => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  return useQuery({
    queryKey: availabilityKeys.calendarMonth(year, month),
    queryFn: () =>
      availabilityService.getAvailabilityForDateRange(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      ),
    staleTime: 2 * 60 * 1000, // 2 minutes for calendar data
    cacheTime: 15 * 60 * 1000, // 15 minutes cache
    ...options,
  });
};

// Mutation hooks with cache invalidation
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateData) =>
      availabilityService.createTemplate(templateData),
    onSuccess: () => {
      // Invalidate templates cache
      queryClient.invalidateQueries({ queryKey: availabilityKeys.templates() });
      // Invalidate calendar cache as templates affect availability
      queryClient.invalidateQueries({ queryKey: availabilityKeys.calendar() });
      toast.success("Template created successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create template");
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, updateData }) =>
      availabilityService.updateTemplate(templateId, updateData),
    onSuccess: (data, variables) => {
      // Invalidate specific template
      queryClient.invalidateQueries({
        queryKey: availabilityKeys.template(variables.templateId),
      });
      // Invalidate templates list
      queryClient.invalidateQueries({ queryKey: availabilityKeys.templates() });
      // Invalidate calendar cache
      queryClient.invalidateQueries({ queryKey: availabilityKeys.calendar() });
      toast.success("Template updated successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update template");
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId) => availabilityService.deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.templates() });
      queryClient.invalidateQueries({ queryKey: availabilityKeys.calendar() });
      toast.success("Template deleted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete template");
    },
  });
};

export const useCreateHoliday = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (holidayData) => availabilityService.createHoliday(holidayData),
    onSuccess: () => {
      // Invalidate holidays cache
      queryClient.invalidateQueries({ queryKey: availabilityKeys.holidays() });
      // Invalidate calendar cache as holidays affect availability
      queryClient.invalidateQueries({ queryKey: availabilityKeys.calendar() });
      toast.success("Holiday created successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create holiday");
    },
  });
};

export const useUpdateHoliday = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ holidayId, updateData }) =>
      availabilityService.updateHoliday(holidayId, updateData),
    onSuccess: (data, variables) => {
      // Invalidate specific holiday
      queryClient.invalidateQueries({
        queryKey: availabilityKeys.holiday(variables.holidayId),
      });
      // Invalidate holidays list
      queryClient.invalidateQueries({ queryKey: availabilityKeys.holidays() });
      // Invalidate calendar cache
      queryClient.invalidateQueries({ queryKey: availabilityKeys.calendar() });
      toast.success("Holiday updated successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update holiday");
    },
  });
};

export const useDeleteHoliday = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (holidayId) => availabilityService.deleteHoliday(holidayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.holidays() });
      queryClient.invalidateQueries({ queryKey: availabilityKeys.calendar() });
      toast.success("Holiday deleted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete holiday");
    },
  });
};

export const useApplyTemplateToDate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, dates }) =>
      availabilityService.applyTemplateToDate(templateId, dates),
    onSuccess: (data, variables) => {
      // Invalidate calendar cache for affected dates
      queryClient.invalidateQueries({ queryKey: availabilityKeys.calendar() });
      toast.success(
        `Template applied to ${variables.dates.length} date(s) successfully`
      );
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to apply template to selected dates"
      );
    },
  });
};

// Utility hook to invalidate all availability data
export const useInvalidateAvailability = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
  };
};
