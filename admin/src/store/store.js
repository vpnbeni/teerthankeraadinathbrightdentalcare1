import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./authSlice";
import availabilitySlice from "./availabilitySlice";
import availabilityTemplateSlice from "./availabilityTemplateSlice";
import holidaySlice from "./holidaySlice";
import customDateSlice from "./customDateSlice";
import auditSlice from "./auditSlice";
import settingsSlice from "./settingsSlice";
import analyticsSlice from "./analyticsSlice";
import userSlice from "./userSlice";
import appointmentSlice from "./appointmentSlice";
import sessionSlice from "./sessionSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    availability: availabilitySlice,
    availabilityTemplate: availabilityTemplateSlice,
    holidays: holidaySlice,
    customDates: customDateSlice,
    audit: auditSlice,
    settings: settingsSlice,
    analytics: analyticsSlice,
    users: userSlice,
    appointments: appointmentSlice,
    sessions: sessionSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export default store;
