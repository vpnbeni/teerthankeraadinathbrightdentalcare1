# Availability Management Redux Slices

This document describes the three Redux slices created for managing the simplified availability system:

1. **availabilityTemplateSlice** - Manages default availability template
2. **holidaySlice** - Manages holiday exceptions
3. **customDateSlice** - Manages custom date overrides

## Overview

The simplified availability system uses a template-based approach with exceptions:

- **Default Template**: Standard time slots that apply to all working days
- **Holiday Exceptions**: Dates with no availability
- **Custom Date Exceptions**: Dates with custom slot configurations

## Store Structure

```javascript
{
  availabilityTemplate: {
    template: {
      _id: string,
      defaultSlots: Array<Slot>,
      workingDays: Array<number>,
      slotDuration: number,
      updatedBy: string,
      updatedAt: Date
    },
    loading: boolean,
    error: string | null,
    pendingSlots: Array<string>,
    removingSlots: Array<string>
  },
  holidays: {
    holidays: Array<Holiday>,
    loading: boolean,
    error: string | null,
    filters: {
      year: number,
      month: number | null,
      isRecurring: boolean | null
    },
    selectedHoliday: Holiday | null,
    viewMode: 'calendar' | 'list',
    pendingHolidays: Array<string>,
    removingHolidays: Array<string>
  },
  customDates: {
    customDates: Array<CustomDate>,
    loading: boolean,
    error: string | null,
    filters: {
      startDate: string | null,
      endDate: string | null,
      reason: string | null
    },
    selectedCustomDate: CustomDate | null,
    viewMode: 'calendar' | 'list',
    previewDate: string | null,
    previewSlots: Array<Slot>,
    isPreviewMode: boolean,
    pendingCustomDates: Array<string>,
    removingCustomDates: Array<string>
  }
}
```

## Usage Examples

### 1. Availability Template Management

```javascript
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAvailabilityTemplate,
  updateAvailabilityTemplate,
  addTemplateSlot,
  removeTemplateSlot,
  optimisticAddSlot,
  toggleSlotActive,
  clearError,
} from "../store/availabilityTemplateSlice";

const TemplateManager = () => {
  const dispatch = useDispatch();
  const { template, loading, error } = useSelector(
    (state) => state.availabilityTemplate
  );

  // Load template on component mount
  useEffect(() => {
    dispatch(fetchAvailabilityTemplate());
  }, [dispatch]);

  // Add a new slot with optimistic update
  const handleAddSlot = (slotData) => {
    // Optimistic update for immediate UI feedback
    dispatch(optimisticAddSlot(slotData));

    // API call
    dispatch(addTemplateSlot(slotData));
  };

  // Toggle slot active state
  const handleToggleSlot = (slotId) => {
    dispatch(toggleSlotActive(slotId));
    // In real implementation, also sync with server
  };

  // Update entire template
  const handleUpdateTemplate = (templateData) => {
    dispatch(updateAvailabilityTemplate(templateData));
  };

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}

      {template.defaultSlots.map((slot) => (
        <div key={slot.id}>
          <span>
            {slot.startTime} - {slot.endTime}
          </span>
          <button onClick={() => handleToggleSlot(slot.id)}>
            {slot.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      ))}

      <button
        onClick={() =>
          handleAddSlot({
            startTime: "19:00",
            endTime: "20:00",
            isActive: true,
          })
        }
      >
        Add Evening Slot
      </button>
    </div>
  );
};
```

### 2. Holiday Management

```javascript
import {
  fetchHolidays,
  addHoliday,
  updateHoliday,
  deleteHoliday,
  bulkAddHolidays,
  optimisticAddHoliday,
  setFilters,
  sortHolidays,
} from "../store/holidaySlice";

const HolidayManager = () => {
  const dispatch = useDispatch();
  const { holidays, loading, error, filters } = useSelector(
    (state) => state.holidays
  );

  // Load holidays
  useEffect(() => {
    dispatch(fetchHolidays());
  }, [dispatch]);

  // Add holiday with optimistic update
  const handleAddHoliday = (holidayData) => {
    dispatch(optimisticAddHoliday(holidayData));
    dispatch(addHoliday(holidayData));
  };

  // Filter holidays by year
  const handleFilterByYear = (year) => {
    dispatch(setFilters({ year }));
  };

  // Sort holidays by date
  const handleSortHolidays = (order = "asc") => {
    dispatch(sortHolidays(order));
  };

  // Bulk add holidays
  const handleBulkAdd = (holidaysArray) => {
    dispatch(bulkAddHolidays({ holidays: holidaysArray }));
  };

  return (
    <div>
      <div>
        <label>Filter by year:</label>
        <select onChange={(e) => handleFilterByYear(parseInt(e.target.value))}>
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
        </select>
      </div>

      {holidays.map((holiday) => (
        <div key={holiday._id}>
          <span>
            {holiday.name} - {holiday.date}
          </span>
          {holiday.isRecurring && <span>(Recurring)</span>}
          <button onClick={() => dispatch(deleteHoliday(holiday._id))}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};
```

### 3. Custom Date Management

```javascript
import {
  fetchCustomDates,
  addCustomDate,
  updateCustomDate,
  deleteCustomDate,
  optimisticAddCustomDate,
  setPreviewDate,
  togglePreviewMode,
  addSlotToCustomDate,
} from "../store/customDateSlice";

const CustomDateManager = () => {
  const dispatch = useDispatch();
  const { customDates, loading, error, previewDate, isPreviewMode } =
    useSelector((state) => state.customDates);

  // Load custom dates
  useEffect(() => {
    dispatch(fetchCustomDates());
  }, [dispatch]);

  // Add custom date with optimistic update
  const handleAddCustomDate = (customDateData) => {
    dispatch(optimisticAddCustomDate(customDateData));
    dispatch(addCustomDate(customDateData));
  };

  // Preview functionality
  const handlePreview = (date) => {
    dispatch(setPreviewDate(date));
    dispatch(togglePreviewMode());
  };

  // Add slot to existing custom date
  const handleAddSlotToDate = (customDateId, slotData) => {
    dispatch(addSlotToCustomDate({ customDateId, slot: slotData }));
  };

  return (
    <div>
      {isPreviewMode && <div>Preview Mode - Date: {previewDate}</div>}

      {customDates.map((customDate) => (
        <div key={customDate._id}>
          <span>
            {customDate.date} - {customDate.reason}
          </span>
          <span>({customDate.customSlots.length} slots)</span>
          <button onClick={() => handlePreview(customDate.date)}>
            Preview
          </button>
        </div>
      ))}
    </div>
  );
};
```

## Async Thunks

### Template Thunks

- `fetchAvailabilityTemplate()` - Load template from server
- `updateAvailabilityTemplate(templateData)` - Update entire template
- `addTemplateSlot(slotData)` - Add new slot to template
- `removeTemplateSlot(slotId)` - Remove slot from template

### Holiday Thunks

- `fetchHolidays()` - Load all holidays
- `addHoliday(holidayData)` - Add single holiday
- `updateHoliday({ id, data })` - Update existing holiday
- `deleteHoliday(id)` - Delete holiday
- `bulkAddHolidays(holidaysData)` - Add multiple holidays

### Custom Date Thunks

- `fetchCustomDates()` - Load all custom dates
- `addCustomDate(customDateData)` - Add custom date
- `updateCustomDate({ id, data })` - Update custom date
- `deleteCustomDate(id)` - Delete custom date
- `bulkAddCustomDates(customDatesData)` - Add multiple custom dates

## Optimistic Updates

All slices support optimistic updates for better user experience:

```javascript
// Template optimistic updates
dispatch(optimisticAddSlot(slotData)); // Add slot immediately
dispatch(optimisticRemoveSlot(slotId)); // Remove slot immediately
dispatch(optimisticUpdateTemplate(data)); // Update template immediately

// Holiday optimistic updates
dispatch(optimisticAddHoliday(holidayData)); // Add holiday immediately
dispatch(optimisticUpdateHoliday({ id, data })); // Update holiday immediately
dispatch(optimisticDeleteHoliday(id)); // Delete holiday immediately

// Custom date optimistic updates
dispatch(optimisticAddCustomDate(data)); // Add custom date immediately
dispatch(optimisticUpdateCustomDate({ id, data })); // Update immediately
dispatch(optimisticDeleteCustomDate(id)); // Delete immediately
```

## Error Handling

Each slice has its own error state and clear error action:

```javascript
// Clear errors
dispatch(clearError()); // Available in all slices

// Rollback optimistic updates on error
dispatch(rollbackOptimisticUpdates()); // Available in all slices
```

## Loading States

Each slice tracks loading state separately:

- `loading` - General loading state
- `pendingSlots/pendingHolidays/pendingCustomDates` - Optimistic additions
- `removingSlots/removingHolidays/removingCustomDates` - Optimistic removals

## Best Practices

1. **Always use optimistic updates** for better UX
2. **Handle errors gracefully** with rollback functionality
3. **Clear errors** when appropriate
4. **Use filters and sorting** for better data management
5. **Leverage preview functionality** for custom dates
6. **Batch operations** when possible using bulk actions

## Testing

The slices include comprehensive tests covering:

- Initial state validation
- Action creators
- Reducer logic
- Optimistic updates
- Error handling
- Integration between slices

Run tests with:

```bash
npm test -- --run src/test/store/availabilitySlices.test.js
```
