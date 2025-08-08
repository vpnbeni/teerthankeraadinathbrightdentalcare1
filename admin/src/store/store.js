import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./authSlice";
import auditSlice from "./auditSlice";
import settingsSlice from "./settingsSlice";
import analyticsSlice from "./analyticsSlice";
import userSlice from "./userSlice";
import appointmentSlice from "./appointmentSlice";
import sessionSlice from "./sessionSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice,
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
