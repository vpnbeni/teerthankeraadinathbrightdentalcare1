import paymentDebugRoutes from "./paymentDebugRoutes";

// Register payment debug routes in development
if (process.env.NODE_ENV === "development") {
  app.use("/api/payments", paymentDebugRoutes);
}
