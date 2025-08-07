/**
 * AccessibilityTester Component Tests
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import AccessibilityTester from "../../shared/components/AccessibilityTester";
import * as accessibilityTesting from "../../shared/utils/accessibility-testing";

// Mock the accessibility testing utilities
vi.mock("../../shared/utils/accessibility-testing", () => ({
  runAccessibilityTests: vi.fn(),
}));

// Mock the hooks
vi.mock("../../shared/hooks", () => ({
  useAccessibility: () => ({
    announce: vi.fn(),
  }),
}));

describe("AccessibilityTester", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when enabled", () => {
    render(<AccessibilityTester enabled={true} />);
    expect(
      screen.getByLabelText("Open accessibility tester")
    ).toBeInTheDocument();
  });

  it("does not render when disabled", () => {
    render(<AccessibilityTester enabled={false} />);
    expect(
      screen.queryByLabelText("Open accessibility tester")
    ).not.toBeInTheDocument();
  });

  it("opens test panel when button is clicked", async () => {
    render(<AccessibilityTester enabled={true} />);

    const openButton = screen.getByLabelText("Open accessibility tester");
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByText("Accessibility Tester")).toBeInTheDocument();
    });
  });

  it("runs accessibility tests", async () => {
    const mockResults = {
      summary: {
        score: 85,
        totalErrors: 2,
        totalWarnings: 3,
        focusableElements: 10,
        landmarks: 4,
      },
      audit: {
        errors: [
          {
            type: "error",
            message: "Image missing alt text",
            rule: "WCAG 1.1.1",
          },
        ],
        warnings: [
          {
            type: "warning",
            message: "Low contrast ratio",
            rule: "WCAG 1.4.3",
          },
        ],
        info: [],
      },
    };

    accessibilityTesting.runAccessibilityTests.mockResolvedValue(mockResults);

    render(<AccessibilityTester enabled={true} />);

    // Open the panel
    const openButton = screen.getByLabelText("Open accessibility tester");
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByText("Accessibility Tester")).toBeInTheDocument();
    });

    // Run tests
    const runButton = screen.getByText("Run Tests");
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText("85/100")).toBeInTheDocument();
      expect(screen.getByText("Image missing alt text")).toBeInTheDocument();
    });

    expect(accessibilityTesting.runAccessibilityTests).toHaveBeenCalled();
  });

  it("displays test results correctly", async () => {
    const mockResults = {
      summary: {
        score: 95,
        totalErrors: 0,
        totalWarnings: 1,
        focusableElements: 15,
        landmarks: 5,
      },
      audit: {
        errors: [],
        warnings: [
          {
            type: "warning",
            message: "Consider adding more descriptive link text",
            rule: "WCAG 2.4.4",
          },
        ],
        info: [],
      },
    };

    accessibilityTesting.runAccessibilityTests.mockResolvedValue(mockResults);

    render(<AccessibilityTester enabled={true} />);

    // Open panel and run tests
    const openButton = screen.getByLabelText("Open accessibility tester");
    fireEvent.click(openButton);

    await waitFor(() => {
      const runButton = screen.getByText("Run Tests");
      fireEvent.click(runButton);
    });

    await waitFor(() => {
      expect(screen.getByText("95/100")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument(); // Errors count
      expect(screen.getByText("1")).toBeInTheDocument(); // Warnings count
    });
  });

  it("shows no issues message when tests pass", async () => {
    const mockResults = {
      summary: {
        score: 100,
        totalErrors: 0,
        totalWarnings: 0,
        focusableElements: 10,
        landmarks: 4,
      },
      audit: {
        errors: [],
        warnings: [],
        info: [],
      },
    };

    accessibilityTesting.runAccessibilityTests.mockResolvedValue(mockResults);

    render(<AccessibilityTester enabled={true} />);

    // Open panel and run tests
    const openButton = screen.getByLabelText("Open accessibility tester");
    fireEvent.click(openButton);

    await waitFor(() => {
      const runButton = screen.getByText("Run Tests");
      fireEvent.click(runButton);
    });

    await waitFor(() => {
      expect(
        screen.getByText("No accessibility issues found!")
      ).toBeInTheDocument();
    });
  });

  it("handles test errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    accessibilityTesting.runAccessibilityTests.mockRejectedValue(
      new Error("Test failed")
    );

    render(<AccessibilityTester enabled={true} />);

    // Open panel and run tests
    const openButton = screen.getByLabelText("Open accessibility tester");
    fireEvent.click(openButton);

    await waitFor(() => {
      const runButton = screen.getByText("Run Tests");
      fireEvent.click(runButton);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Accessibility test failed:",
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it("opens issue details modal", async () => {
    const mockResults = {
      summary: {
        score: 80,
        totalErrors: 1,
        totalWarnings: 0,
        focusableElements: 10,
        landmarks: 4,
      },
      audit: {
        errors: [
          {
            type: "error",
            message: "Button missing accessible name",
            rule: "WCAG 4.1.2",
            element: document.createElement("button"),
          },
        ],
        warnings: [],
        info: [],
      },
    };

    accessibilityTesting.runAccessibilityTests.mockResolvedValue(mockResults);

    render(<AccessibilityTester enabled={true} />);

    // Open panel and run tests
    const openButton = screen.getByLabelText("Open accessibility tester");
    fireEvent.click(openButton);

    await waitFor(() => {
      const runButton = screen.getByText("Run Tests");
      fireEvent.click(runButton);
    });

    await waitFor(() => {
      const issueButton = screen.getByText("Button missing accessible name");
      fireEvent.click(issueButton);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Accessibility Issue Details")
      ).toBeInTheDocument();
      expect(screen.getByText("How to Fix")).toBeInTheDocument();
    });
  });
});
