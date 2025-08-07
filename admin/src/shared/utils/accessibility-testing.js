// Accessibility Testing Utilities
// Provides automated accessibility testing and validation

// Simple accessibility audit utilities
export const accessibilityAudit = {
  // Run basic accessibility audit
  auditPage: (container = document) => {
    const results = {
      errors: [],
      warnings: [],
      info: [],
      score: 0,
    };

    try {
      // Run basic audit checks
      results.errors.push(...accessibilityAudit.checkImages(container));
      results.errors.push(...accessibilityAudit.checkHeadings(container));
      results.errors.push(...accessibilityAudit.checkForms(container));
      results.warnings.push(...accessibilityAudit.checkFocusable(container));
      results.info.push(...accessibilityAudit.checkLandmarks(container));

      // Calculate basic score
      const totalIssues = results.errors.length + results.warnings.length;
      results.score = Math.max(
        0,
        100 - results.errors.length * 10 - results.warnings.length * 5
      );

      return results;
    } catch (error) {
      console.warn("Accessibility audit failed:", error);
      return { errors: [], warnings: [], info: [], score: 0 };
    }
  },

  // Check images for alt text
  checkImages: (container) => {
    const issues = [];
    try {
      const images = container.querySelectorAll("img");
      images.forEach((img, index) => {
        const alt = img.getAttribute("alt");
        const ariaLabel = img.getAttribute("aria-label");
        const role = img.getAttribute("role");

        if (role === "presentation" || alt === "") return;

        if (!alt && !ariaLabel) {
          issues.push({
            type: "error",
            element: img,
            message: `Image ${index + 1} is missing alt text`,
            rule: "WCAG 1.1.1 - Non-text Content",
          });
        }
      });
    } catch (error) {
      console.warn("Image check failed:", error);
    }
    return issues;
  },

  // Check heading structure
  checkHeadings: (container) => {
    const issues = [];
    try {
      const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
      let previousLevel = 0;

      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));

        if (index === 0 && level !== 1) {
          issues.push({
            type: "warning",
            element: heading,
            message: "Page should start with h1",
            rule: "WCAG 1.3.1 - Info and Relationships",
          });
        }

        if (level > previousLevel + 1) {
          issues.push({
            type: "error",
            element: heading,
            message: `Heading level ${level} skips level ${previousLevel + 1}`,
            rule: "WCAG 1.3.1 - Info and Relationships",
          });
        }

        if (!heading.textContent.trim()) {
          issues.push({
            type: "error",
            element: heading,
            message: "Heading is empty",
            rule: "WCAG 2.4.6 - Headings and Labels",
          });
        }

        previousLevel = level;
      });
    } catch (error) {
      console.warn("Heading check failed:", error);
    }
    return issues;
  },

  // Check form accessibility
  checkForms: (container) => {
    const issues = [];
    try {
      const inputs = container.querySelectorAll("input, select, textarea");
      inputs.forEach((input, index) => {
        const label = container.querySelector(`label[for="${input.id}"]`);
        const ariaLabel = input.getAttribute("aria-label");
        const ariaLabelledBy = input.getAttribute("aria-labelledby");

        if (!label && !ariaLabel && !ariaLabelledBy) {
          issues.push({
            type: "error",
            element: input,
            message: `Form input ${index + 1} is missing a label`,
            rule: "WCAG 1.3.1 - Info and Relationships",
          });
        }
      });
    } catch (error) {
      console.warn("Form check failed:", error);
    }
    return issues;
  },

  // Check focusable elements
  checkFocusable: (container) => {
    const issues = [];
    try {
      const focusableElements = container.querySelectorAll(
        'button, input, select, textarea, a[href], [tabindex], [contenteditable="true"]'
      );

      focusableElements.forEach((element) => {
        const tabIndex = element.getAttribute("tabindex");
        if (tabIndex && parseInt(tabIndex) > 0) {
          issues.push({
            type: "warning",
            element: element,
            message: "Avoid positive tabindex values",
            rule: "WCAG 2.4.3 - Focus Order",
          });
        }
      });
    } catch (error) {
      console.warn("Focusable check failed:", error);
    }
    return issues;
  },

  // Check landmarks
  checkLandmarks: (container) => {
    const issues = [];
    try {
      const landmarks = container.querySelectorAll(
        'main, nav, aside, header, footer, section, [role="main"], [role="navigation"], [role="complementary"], [role="banner"], [role="contentinfo"]'
      );

      if (landmarks.length === 0) {
        issues.push({
          type: "info",
          element: container,
          message: "Page has no landmark elements",
          rule: "WCAG 1.3.1 - Info and Relationships",
        });
      }
    } catch (error) {
      console.warn("Landmark check failed:", error);
    }
    return issues;
  },
};

// Simple keyboard testing utilities
export const keyboardTesting = {
  testKeyboardNavigation: (container = document) => {
    const results = {
      focusableElements: [],
      issues: [],
    };

    try {
      const focusableElements = container.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
      );

      results.focusableElements = Array.from(focusableElements);
    } catch (error) {
      console.warn("Keyboard navigation test failed:", error);
    }

    return results;
  },
};

// Simple screen reader testing utilities
export const screenReaderTesting = {
  testAnnouncements: (container = document) => {
    const results = {
      liveRegions: [],
      landmarks: [],
      headings: [],
    };

    try {
      results.liveRegions = Array.from(
        container.querySelectorAll("[aria-live]")
      );
      results.landmarks = Array.from(
        container.querySelectorAll(
          'main, nav, aside, header, footer, section, [role="main"], [role="navigation"], [role="complementary"], [role="banner"], [role="contentinfo"]'
        )
      );
      results.headings = Array.from(
        container.querySelectorAll("h1, h2, h3, h4, h5, h6")
      );
    } catch (error) {
      console.warn("Screen reader test failed:", error);
    }

    return results;
  },
};

// Main test runner
export const runAccessibilityTests = async (container = document) => {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      audit: accessibilityAudit.auditPage(container),
      keyboard: keyboardTesting.testKeyboardNavigation(container),
      screenReader: screenReaderTesting.testAnnouncements(container),
    };

    // Generate summary
    results.summary = {
      totalErrors: results.audit.errors.length,
      totalWarnings: results.audit.warnings.length,
      score: results.audit.score,
      focusableElements: results.keyboard.focusableElements.length,
      liveRegions: results.screenReader.liveRegions.length,
      landmarks: results.screenReader.landmarks.length,
    };

    return results;
  } catch (error) {
    console.warn("Accessibility tests failed:", error);
    return {
      timestamp: new Date().toISOString(),
      audit: { errors: [], warnings: [], info: [], score: 0 },
      keyboard: { focusableElements: [], issues: [] },
      screenReader: { liveRegions: [], landmarks: [], headings: [] },
      summary: {
        totalErrors: 0,
        totalWarnings: 0,
        score: 0,
        focusableElements: 0,
        liveRegions: 0,
        landmarks: 0,
      },
    };
  }
};

export default {
  accessibilityAudit,
  keyboardTesting,
  screenReaderTesting,
  runAccessibilityTests,
};
