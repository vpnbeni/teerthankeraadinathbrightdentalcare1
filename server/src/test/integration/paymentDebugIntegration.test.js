import { jest } from "@jest/globals";
import { paymentDebugger } from "../../services/paymentDebugger.js";
import { paymentLogger } from "../../services/paymentLogger.js";

// Mock external dependencies
jest.mock("../../models/index.js", () => ({
  Payment: {
    findById: jest.fn(),
    find: jest.fn(),
    aggregate: jest.fn(),
  },
  Plan: {
    findById: jest.fn(),
  },
  User: {
    findById: jest.fn(),
  },
}));

jest.mock("../../utils/logger.js", () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Payment Debug Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    paymentDebugger.debugSessions.clear();
    paymentDebugger.traceBuffer.clear();
  });

  afterEach(() => {
    paymentDebugger.debugSessions.clear();
    paymentDebugger.traceBuffer.clear();
  });

  describe("Debug Session Workflow", () => {
    it("should handle complete debug session workflow", () => {
      const sessionId = "integration-test-session";

      // Start debug session
      const session = paymentDebugger.startDebugSession(sessionId, {
        logLevel: "debug",
        trackPerformance: true,
      });

      expect(session.id).toBe(sessionId);
      expect(session.options.logLevel).toBe("debug");

      // Add traces during payment operations
      const requestId = "req-integration-test";

      paymentDebugger.addTrace(sessionId, requestId, "payment_order_creation", {
        userId: "user123",
        planId: "plan123",
        amount: 1000,
      });

      paymentDebugger.addTrace(sessionId, requestId, "razorpay_api_call", {
        operation: "create_order",
        response: { orderId: "order123" },
      });

      paymentDebugger.addTrace(sessionId, requestId, "database_operation", {
        operation: "create_payment",
        result: { paymentId: "payment123" },
      });

      // Check session status
      const status = paymentDebugger.getDebugSessionStatus(sessionId);
      expect(status.traceCount).toBe(3);

      // Stop session and get summary
      const summary = paymentDebugger.stopDebugSession(sessionId);
      expect(summary.totalTraces).toBe(3);
      expect(summary.traces).toHaveLength(3);
      expect(summary.sessionId).toBe(sessionId);
    });

    it("should handle request tracing across operations", () => {
      const requestId = "req-trace-test";

      // Simulate payment flow traces
      const traces = [
        {
          operation: "order_creation_start",
          data: { userId: "user123", planId: "plan123" },
        },
        {
          operation: "plan_validation",
          data: { planId: "plan123", planName: "Basic Plan" },
        },
        {
          operation: "user_validation",
          data: { userId: "user123", isVerified: true },
        },
        {
          operation: "razorpay_order_creation",
          data: { orderId: "order123", amount: 1000 },
        },
        {
          operation: "payment_record_creation",
          data: { paymentId: "payment123", status: "pending" },
        },
        {
          operation: "order_creation_complete",
          data: { success: true, orderId: "order123" },
        },
      ];

      // Add all traces
      traces.forEach((trace, index) => {
        paymentDebugger.addToTraceBuffer(requestId, {
          ...trace,
          timestamp: new Date(Date.now() + index * 100).toISOString(),
        });
      });

      // Retrieve and verify traces
      const retrievedTraces = paymentDebugger.getRequestTrace(requestId);
      expect(retrievedTraces).toHaveLength(6);
      expect(retrievedTraces[0].operation).toBe("order_creation_start");
      expect(retrievedTraces[5].operation).toBe("order_creation_complete");
    });

    it("should sanitize sensitive data in traces", () => {
      const requestId = "req-sanitization-test";

      const sensitiveTrace = {
        operation: "payment_verification",
        data: {
          razorpaySignature: "sensitive_signature_123",
          razorpayPaymentId: "pay_123",
          userPhone: "1234567890",
          userEmail: "user@example.com",
          planPrice: 1000,
          publicData: "this should remain",
        },
      };

      paymentDebugger.addToTraceBuffer(requestId, sensitiveTrace);

      const retrievedTraces = paymentDebugger.getRequestTrace(requestId);
      const trace = retrievedTraces[0];

      expect(trace.data.razorpaySignature).toBe("[REDACTED]");
      expect(trace.data.userPhone).toBe("[REDACTED]");
      expect(trace.data.userEmail).toBe("[REDACTED]");
      expect(trace.data.planPrice).toBe(1000);
      expect(trace.data.publicData).toBe("this should remain");
    });
  });

  describe("Debugger Statistics and Management", () => {
    it("should track debugger statistics correctly", () => {
      // Start multiple sessions
      paymentDebugger.startDebugSession("session-1");
      paymentDebugger.startDebugSession("session-2");

      // Add traces
      paymentDebugger.addToTraceBuffer("req-1", { operation: "test-1" });
      paymentDebugger.addToTraceBuffer("req-2", { operation: "test-2" });
      paymentDebugger.addToTraceBuffer("req-3", { operation: "test-3" });

      const stats = paymentDebugger.getDebuggerStats();

      expect(stats.activeDebugSessions).toBe(2);
      expect(stats.traceBufferSize).toBe(3);
      expect(stats.maxTraceBufferSize).toBe(1000);
      expect(stats.maxDebugSessions).toBe(50);
      expect(stats.timestamp).toBeDefined();
    });

    it("should clear trace buffer correctly", () => {
      // Add traces
      paymentDebugger.addToTraceBuffer("req-1", { operation: "test-1" });
      paymentDebugger.addToTraceBuffer("req-2", { operation: "test-2" });

      expect(paymentDebugger.traceBuffer.size).toBe(2);

      const result = paymentDebugger.clearTraceBuffer();

      expect(result.clearedTraces).toBe(2);
      expect(paymentDebugger.traceBuffer.size).toBe(0);
    });

    it("should limit trace buffer size", () => {
      const originalMaxSize = paymentDebugger.maxTraceBufferSize;
      paymentDebugger.maxTraceBufferSize = 3; // Set small limit for testing

      // Add more traces than the limit
      for (let i = 1; i <= 5; i++) {
        paymentDebugger.addToTraceBuffer(`req-${i}`, {
          operation: `test-${i}`,
          index: i,
        });
      }

      // Should only keep the most recent traces
      expect(paymentDebugger.traceBuffer.size).toBe(3);

      // Verify the oldest traces were removed
      expect(paymentDebugger.getRequestTrace("req-1")).toEqual([]);
      expect(paymentDebugger.getRequestTrace("req-2")).toEqual([]);
      expect(paymentDebugger.getRequestTrace("req-3")).toHaveLength(1);
      expect(paymentDebugger.getRequestTrace("req-4")).toHaveLength(1);
      expect(paymentDebugger.getRequestTrace("req-5")).toHaveLength(1);

      // Restore original limit
      paymentDebugger.maxTraceBufferSize = originalMaxSize;
    });
  });

  describe("Integration with Payment Logger", () => {
    it("should work alongside payment logger", () => {
      const requestId = "req-logger-integration";

      // Simulate payment logger metrics
      const loggerMetrics = paymentLogger.getMetricsSnapshot();
      expect(loggerMetrics).toBeDefined();
      expect(loggerMetrics.timestamp).toBeDefined();

      // Add debug traces
      paymentDebugger.addToTraceBuffer(requestId, {
        operation: "payment_with_logger",
        data: {
          loggerMetrics: loggerMetrics.metrics,
          debuggerStats: paymentDebugger.getDebuggerStats(),
        },
      });

      const traces = paymentDebugger.getRequestTrace(requestId);
      expect(traces).toHaveLength(1);
      expect(traces[0].data.loggerMetrics).toBeDefined();
      expect(traces[0].data.debuggerStats).toBeDefined();
    });
  });
});
