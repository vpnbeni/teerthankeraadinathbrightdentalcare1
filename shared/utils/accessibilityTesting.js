/**
 * Accessibility testing utilities for automated and manual testing
 */

// Color contrast testing
export const testColorContrast = (foreground, background) => {
  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  // Calculate relative luminance
  const getLuminance = (r, g, b) => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  // Calculate contrast ratio
  const getContrastRatio = (color1, color2) => {
    const lum1 = getLuminance(color1.r, color1.g, color1.b);
    const lum2 = getLuminance(color2.r, color2.g, color2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  };

  const fgColor = hexToRgb(foreground);
  const bgColor = hexToRgb(background);

  if (!fgColor || !bgColor) {
    return { error: "Invalid color format" };
  }

  const ratio = getContrastRatio(fgColor, bgColor);

  return {
    ratio: ratio.toFixed(2),
    passAA: ratio >= 4.5,
    passAAA: ratio >= 7,
    passAALarge: ratio >= 3,
    passAAALarge: ratio >= 4.5,
    grade:
      ratio >= 7
        ? "AAA"
        : ratio >= 4.5
        ? "AA"
        : ratio >= 3
        ? "AA Large"
        : "Fail",
  };
};

// Keyboard navigation testing
export const testKeyboardNavigation = () => {
  const focusableElements = document.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const results = {
    totalFocusableElements: focusableElements.length,
    elementsWithoutTabIndex: 0,
    elementsWithNegativeTabIndex: 0,
    elementsWithPositiveTabIndex: 0,
    elementsWithoutVisibleFocus: 0,
    issues: [],
  };

  focusableElements.forEach((element, index) => {
    const tabIndex = element.getAttribute("tabindex");
    const computedStyle = window.getComputedStyle(element);

    // Check tabindex values
    if (!tabIndex) {
      results.elementsWithoutTabIndex++;
    } else if (parseInt(tabIndex) < 0) {
      results.elementsWithNegativeTabIndex++;
    } else if (parseInt(tabIndex) > 0) {
      results.elementsWithPositiveTabIndex++;
      results.issues.push({
        element: element.tagName.toLowerCase(),
        issue: "Positive tabindex found",
        recommendation: 'Use tabindex="0" or remove tabindex attribute',
      });
    }

    // Check for visible focus indicators
    const focusOutline = computedStyle.outline;
    const focusOutlineWidth = computedStyle.outlineWidth;
    const focusBoxShadow = computedStyle.boxShadow;

    if (
      focusOutline === "none" &&
      focusOutlineWidth === "0px" &&
      !focusBoxShadow.includes("inset")
    ) {
      results.elementsWithoutVisibleFocus++;
      results.issues.push({
        element: element.tagName.toLowerCase(),
        issue: "No visible focus indicator",
        recommendation: "Add focus styles with outline or box-shadow",
      });
    }
  });

  return results;
};

// ARIA attributes testing
export const testAriaAttributes = () => {
  const results = {
    elementsWithAriaLabel: 0,
    elementsWithAriaDescribedBy: 0,
    elementsWithAriaExpanded: 0,
    elementsWithAriaHidden: 0,
    invalidAriaReferences: 0,
    issues: [],
  };

  // Test aria-label
  const elementsWithAriaLabel = document.querySelectorAll("[aria-label]");
  results.elementsWithAriaLabel = elementsWithAriaLabel.length;

  elementsWithAriaLabel.forEach((element) => {
    const ariaLabel = element.getAttribute("aria-label");
    if (!ariaLabel || ariaLabel.trim() === "") {
      results.issues.push({
        element: element.tagName.toLowerCase(),
        issue: "Empty aria-label attribute",
        recommendation:
          "Provide meaningful aria-label text or remove attribute",
      });
    }
  });

  // Test aria-describedby references
  const elementsWithAriaDescribedBy =
    document.querySelectorAll("[aria-describedby]");
  results.elementsWithAriaDescribedBy = elementsWithAriaDescribedBy.length;

  elementsWithAriaDescribedBy.forEach((element) => {
    const describedBy = element.getAttribute("aria-describedby");
    const referencedIds = describedBy.split(" ");

    referencedIds.forEach((id) => {
      if (!document.getElementById(id)) {
        results.invalidAriaReferences++;
        results.issues.push({
          element: element.tagName.toLowerCase(),
          issue: `aria-describedby references non-existent ID: ${id}`,
          recommendation:
            "Ensure referenced element exists or remove invalid reference",
        });
      }
    });
  });

  // Test aria-expanded
  const elementsWithAriaExpanded = document.querySelectorAll("[aria-expanded]");
  results.elementsWithAriaExpanded = elementsWithAriaExpanded.length;

  elementsWithAriaExpanded.forEach((element) => {
    const ariaExpanded = element.getAttribute("aria-expanded");
    if (ariaExpanded !== "true" && ariaExpanded !== "false") {
      results.issues.push({
        element: element.tagName.toLowerCase(),
        issue: "Invalid aria-expanded value",
        recommendation: 'Use "true" or "false" for aria-expanded',
      });
    }
  });

  // Test aria-hidden
  const elementsWithAriaHidden = document.querySelectorAll("[aria-hidden]");
  results.elementsWithAriaHidden = elementsWithAriaHidden.length;

  elementsWithAriaHidden.forEach((element) => {
    const ariaHidden = element.getAttribute("aria-hidden");
    if (ariaHidden !== "true" && ariaHidden !== "false") {
      results.issues.push({
        element: element.tagName.toLowerCase(),
        issue: "Invalid aria-hidden value",
        recommendation: 'Use "true" or "false" for aria-hidden',
      });
    }

    // Check if focusable elements are hidden
    const focusableChildren = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (ariaHidden === "true" && focusableChildren.length > 0) {
      results.issues.push({
        element: element.tagName.toLowerCase(),
        issue: "Focusable elements inside aria-hidden container",
        recommendation: 'Remove focusable elements or use tabindex="-1"',
      });
    }
  });

  return results;
};

// Form accessibility testing
export const testFormAccessibility = () => {
  const results = {
    totalInputs: 0,
    inputsWithLabels: 0,
    inputsWithoutLabels: 0,
    inputsWithPlaceholderOnly: 0,
    inputsWithRequiredAttribute: 0,
    inputsWithAriaRequired: 0,
    issues: [],
  };

  const inputs = document.querySelectorAll("input, select, textarea");
  results.totalInputs = inputs.length;

  inputs.forEach((input) => {
    const id = input.getAttribute("id");
    const ariaLabel = input.getAttribute("aria-label");
    const ariaLabelledBy = input.getAttribute("aria-labelledby");
    const placeholder = input.getAttribute("placeholder");
    const required = input.hasAttribute("required");
    const ariaRequired = input.getAttribute("aria-required");

    // Check for labels
    let hasLabel = false;

    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) {
        hasLabel = true;
        results.inputsWithLabels++;
      }
    }

    if (ariaLabel || ariaLabelledBy) {
      hasLabel = true;
      if (!results.inputsWithLabels) results.inputsWithLabels++;
    }

    if (!hasLabel) {
      results.inputsWithoutLabels++;

      if (placeholder) {
        results.inputsWithPlaceholderOnly++;
        results.issues.push({
          element: input.tagName.toLowerCase(),
          issue: "Input uses placeholder as label",
          recommendation: "Add proper label element or aria-label",
        });
      } else {
        results.issues.push({
          element: input.tagName.toLowerCase(),
          issue: "Input has no accessible label",
          recommendation: "Add label element, aria-label, or aria-labelledby",
        });
      }
    }

    // Check required attributes
    if (required) {
      results.inputsWithRequiredAttribute++;

      if (!ariaRequired) {
        results.issues.push({
          element: input.tagName.toLowerCase(),
          issue: "Required input missing aria-required",
          recommendation: 'Add aria-required="true" to required inputs',
        });
      }
    }

    if (ariaRequired === "true") {
      results.inputsWithAriaRequired++;
    }
  });

  return results;
};

// Heading structure testing
export const testHeadingStructure = () => {
  const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const results = {
    totalHeadings: headings.length,
    headingLevels: {},
    issues: [],
    structure: [],
  };

  let previousLevel = 0;

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    const text = heading.textContent.trim();

    // Count heading levels
    results.headingLevels[`h${level}`] =
      (results.headingLevels[`h${level}`] || 0) + 1;

    // Check heading structure
    results.structure.push({
      level,
      text: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
      element: heading.tagName.toLowerCase(),
    });

    // Check for proper heading hierarchy
    if (index === 0 && level !== 1) {
      results.issues.push({
        element: heading.tagName.toLowerCase(),
        issue: "Page should start with h1",
        recommendation: "Use h1 for the main page heading",
      });
    }

    if (level > previousLevel + 1) {
      results.issues.push({
        element: heading.tagName.toLowerCase(),
        issue: `Heading level skipped (h${previousLevel} to h${level})`,
        recommendation: "Use sequential heading levels",
      });
    }

    // Check for empty headings
    if (!text) {
      results.issues.push({
        element: heading.tagName.toLowerCase(),
        issue: "Empty heading element",
        recommendation: "Provide meaningful heading text or remove element",
      });
    }

    previousLevel = level;
  });

  return results;
};

// Image accessibility testing
export const testImageAccessibility = () => {
  const images = document.querySelectorAll("img");
  const results = {
    totalImages: images.length,
    imagesWithAlt: 0,
    imagesWithoutAlt: 0,
    imagesWithEmptyAlt: 0,
    decorativeImages: 0,
    issues: [],
  };

  images.forEach((img) => {
    const alt = img.getAttribute("alt");
    const src = img.getAttribute("src");

    if (alt === null) {
      results.imagesWithoutAlt++;
      results.issues.push({
        element: "img",
        issue: "Image missing alt attribute",
        recommendation:
          'Add alt attribute with descriptive text or empty alt="" for decorative images',
      });
    } else if (alt === "") {
      results.imagesWithEmptyAlt++;
      results.decorativeImages++;
    } else {
      results.imagesWithAlt++;

      // Check for poor alt text
      const poorAltPatterns = [
        /^image of/i,
        /^picture of/i,
        /^photo of/i,
        /^graphic of/i,
        /^icon/i,
        /^logo/i,
      ];

      if (poorAltPatterns.some((pattern) => pattern.test(alt))) {
        results.issues.push({
          element: "img",
          issue: "Alt text could be more descriptive",
          recommendation:
            "Describe the content and function, not the type of image",
        });
      }

      // Check for filename as alt text
      if (
        (src && alt.includes(".jpg")) ||
        alt.includes(".png") ||
        alt.includes(".gif")
      ) {
        results.issues.push({
          element: "img",
          issue: "Alt text appears to be filename",
          recommendation: "Use descriptive text instead of filename",
        });
      }
    }
  });

  return results;
};

// Run comprehensive accessibility audit
export const runAccessibilityAudit = () => {
  const audit = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    results: {
      colorContrast: testColorContrast("#000000", "#ffffff"), // Example test
      keyboardNavigation: testKeyboardNavigation(),
      ariaAttributes: testAriaAttributes(),
      formAccessibility: testFormAccessibility(),
      headingStructure: testHeadingStructure(),
      imageAccessibility: testImageAccessibility(),
    },
    summary: {
      totalIssues: 0,
      criticalIssues: 0,
      warnings: 0,
      passed: 0,
    },
  };

  // Calculate summary
  Object.values(audit.results).forEach((result) => {
    if (result.issues) {
      audit.summary.totalIssues += result.issues.length;

      result.issues.forEach((issue) => {
        if (
          issue.issue.includes("missing") ||
          issue.issue.includes("invalid")
        ) {
          audit.summary.criticalIssues++;
        } else {
          audit.summary.warnings++;
        }
      });
    }
  });

  audit.summary.passed =
    Object.keys(audit.results).length - audit.summary.totalIssues;

  return audit;
};

// Generate accessibility report
export const generateAccessibilityReport = (audit) => {
  const report = {
    title: "Accessibility Audit Report",
    timestamp: audit.timestamp,
    url: audit.url,
    summary: audit.summary,
    sections: [],
  };

  // Color Contrast Section
  if (audit.results.colorContrast) {
    report.sections.push({
      title: "Color Contrast",
      status: audit.results.colorContrast.passAA ? "pass" : "fail",
      details: audit.results.colorContrast,
    });
  }

  // Keyboard Navigation Section
  if (audit.results.keyboardNavigation) {
    const kbNav = audit.results.keyboardNavigation;
    report.sections.push({
      title: "Keyboard Navigation",
      status: kbNav.issues.length === 0 ? "pass" : "fail",
      details: {
        totalFocusableElements: kbNav.totalFocusableElements,
        issues: kbNav.issues.length,
        recommendations: kbNav.issues.map((issue) => issue.recommendation),
      },
    });
  }

  // ARIA Attributes Section
  if (audit.results.ariaAttributes) {
    const aria = audit.results.ariaAttributes;
    report.sections.push({
      title: "ARIA Attributes",
      status: aria.issues.length === 0 ? "pass" : "fail",
      details: {
        elementsWithAriaLabel: aria.elementsWithAriaLabel,
        invalidReferences: aria.invalidAriaReferences,
        issues: aria.issues.length,
      },
    });
  }

  // Form Accessibility Section
  if (audit.results.formAccessibility) {
    const forms = audit.results.formAccessibility;
    report.sections.push({
      title: "Form Accessibility",
      status: forms.inputsWithoutLabels === 0 ? "pass" : "fail",
      details: {
        totalInputs: forms.totalInputs,
        inputsWithLabels: forms.inputsWithLabels,
        inputsWithoutLabels: forms.inputsWithoutLabels,
      },
    });
  }

  // Heading Structure Section
  if (audit.results.headingStructure) {
    const headings = audit.results.headingStructure;
    report.sections.push({
      title: "Heading Structure",
      status: headings.issues.length === 0 ? "pass" : "fail",
      details: {
        totalHeadings: headings.totalHeadings,
        headingLevels: headings.headingLevels,
        issues: headings.issues.length,
      },
    });
  }

  // Image Accessibility Section
  if (audit.results.imageAccessibility) {
    const images = audit.results.imageAccessibility;
    report.sections.push({
      title: "Image Accessibility",
      status: images.imagesWithoutAlt === 0 ? "pass" : "fail",
      details: {
        totalImages: images.totalImages,
        imagesWithAlt: images.imagesWithAlt,
        imagesWithoutAlt: images.imagesWithoutAlt,
      },
    });
  }

  return report;
};

export default {
  testColorContrast,
  testKeyboardNavigation,
  testAriaAttributes,
  testFormAccessibility,
  testHeadingStructure,
  testImageAccessibility,
  runAccessibilityAudit,
  generateAccessibilityReport,
};
