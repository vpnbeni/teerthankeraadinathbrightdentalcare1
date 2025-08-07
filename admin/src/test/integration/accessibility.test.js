/**
 * Accessibility Integration Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { runAccessibilityTests } from "../../shared/utils/accessibility-testing";
import {
  animationAccessibility,
  focusManagement,
  keyboardNavigation,
  ariaUtils,
} from "../../shared/utils/accessibility";

// Mock DOM environment
const mockElement = (tagName, attributes = {}) => {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
};

describe("Accessibility Integration Tests", () => {
  let container;

  beforeEach(() => {
    // Create a clean container for each test
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe("Focus Management", () => {
    it("should identify focusable elements correctly", () => {
      container.innerHTML = `
        <button>Button 1</button>
        <input type="text" />
        <a href="#test">Link</a>
        <button disabled>Disabled Button</button>
        <div tabindex="0">Focusable Div</div>
        <div tabindex="-1">Non-focusable Div</div>
      `;

      const focusableElements = focusManagement.getFocusableElements(container);

      expect(focusableElements).toHaveLength(4); // button, input, link, focusable div
      expect(focusableElements[0].tagName).toBe("BUTTON");
      expect(focusableElements[1].tagName).toBe("INPUT");
      expect(focusableElements[2].tagName).toBe("A");
      expect(focusableElements[3].tagName).toBe("DIV");
    });

    it("should trap focus within a container", () => {
      container.innerHTML = `
        <button id="first">First</button>
        <input id="middle" type="text" />
        <button id="last">Last</button>
      `;

      const cleanup = focusManagement.trapFocus(container);

      // Focus should be trapped within the container
      const firstButton = container.querySelector("#first");
      const lastButton = container.querySelector("#last");

      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);

      // Simulate tab key at the end
      lastButton.focus();
      const tabEvent = new KeyboardEvent("keydown", { key: "Tab" });
      container.dispatchEvent(tabEvent);

      cleanup();
    });

    it("should handle arrow navigation correctly", () => {
      const elements = [
        mockElement("button", { id: "btn1" }),
        mockElement("button", { id: "btn2" }),
        mockElement("button", { id: "btn3" }),
      ];

      elements.forEach((el) => container.appendChild(el));

      // Test right arrow navigation
      let newIndex = focusManagement.handleArrowNavigation(
        elements,
        0,
        "right"
      );
      expect(newIndex).toBe(1);

      // Test left arrow navigation
      newIndex = focusManagement.handleArrowNavigation(elements, 1, "left");
      expect(newIndex).toBe(0);

      // Test wrap-around
      newIndex = focusManagement.handleArrowNavigation(elements, 2, "right");
      expect(newIndex).toBe(0);

      // Test home/end
      newIndex = focusManagement.handleArrowNavigation(elements, 1, "home");
      expect(newIndex).toBe(0);

      newIndex = focusManagement.handleArrowNavigation(elements, 1, "end");
      expect(newIndex).toBe(2);
    });
  });

  describe("Keyboard Navigation", () => {
    it("should handle keyboard events correctly", () => {
      const handlers = {
        Enter: vi.fn(),
        " ": vi.fn(),
        Escape: vi.fn(),
      };

      const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
      const spaceEvent = new KeyboardEvent("keydown", { key: " " });
      const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });

      keyboardNavigation.handleKeyDown(enterEvent, handlers);
      keyboardNavigation.handleKeyDown(spaceEvent, handlers);
      keyboardNavigation.handleKeyDown(escapeEvent, handlers);

      expect(handlers.Enter).toHaveBeenCalledWith(enterEvent);
      expect(handlers[" "]).toHaveBeenCalledWith(spaceEvent);
      expect(handlers.Escape).toHaveBeenCalledWith(escapeEvent);
    });

    it("should create roving tabindex behavior", () => {
      const items = [
        mockElement("button", { id: "item1" }),
        mockElement("button", { id: "item2" }),
        mockElement("button", { id: "item3" }),
      ];

      items.forEach((item) => container.appendChild(item));

      const cleanup = keyboardNavigation.createRovingTabindex(container, items);

      // Initially, first item should have tabindex="0"
      expect(items[0].getAttribute("tabindex")).toBe("0");
      expect(items[1].getAttribute("tabindex")).toBe("-1");
      expect(items[2].getAttribute("tabindex")).toBe("-1");

      cleanup();
    });
  });

  describe("ARIA Utils", () => {
    it("should generate unique IDs", () => {
      const id1 = ariaUtils.generateId("test");
      const id2 = ariaUtils.generateId("test");

      expect(id1).toMatch(/^test-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^test-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it("should set ARIA attributes safely", () => {
      const element = mockElement("div");

      ariaUtils.setAttributes(element, {
        "aria-label": "Test Label",
        "aria-expanded": "true",
        "aria-hidden": null, // Should remove attribute
      });

      expect(element.getAttribute("aria-label")).toBe("Test Label");
      expect(element.getAttribute("aria-expanded")).toBe("true");
      expect(element.hasAttribute("aria-hidden")).toBe(false);
    });

    it("should toggle expanded state correctly", () => {
      const trigger = mockElement("button", { "aria-expanded": "false" });
      const target = mockElement("div", { "aria-hidden": "true" });

      container.appendChild(trigger);
      container.appendChild(target);

      const newState = ariaUtils.toggleExpanded(trigger, target);

      expect(newState).toBe(true);
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      expect(target.getAttribute("aria-hidden")).toBe("false");
    });

    it("should announce messages to screen readers", () => {
      const spy = vi.spyOn(document.body, "appendChild");

      ariaUtils.announce("Test message", "assertive");

      expect(spy).toHaveBeenCalled();

      // Check that an element with aria-live was created
      const calls = spy.mock.calls;
      const announcerCall = calls.find(
        (call) =>
          call[0].getAttribute &&
          call[0].getAttribute("aria-live") === "assertive"
      );

      expect(announcerCall).toBeTruthy();

      spy.mockRestore();
    });
  });

  describe("Animation Accessibility", () => {
    it("should respect reduced motion preferences", () => {
      // Mock matchMedia for reduced motion
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      expect(animationAccessibility.prefersReducedMotion()).toBe(true);
      expect(animationAccessibility.getAnimationDuration(300)).toBe(0);
    });

    it("should create safe transitions", () => {
      const transition = animationAccessibility.createSafeTransition(
        "opacity",
        300,
        "ease"
      );
      expect(transition).toMatch(/opacity \d+ms ease/);
    });

    it("should handle smooth scrolling with reduced motion", () => {
      const element = mockElement("div");
      const scrollIntoViewSpy = vi.fn();
      element.scrollIntoView = scrollIntoViewSpy;

      // Mock reduced motion
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === "(prefers-reduced-motion: reduce)",
        })),
      });

      animationAccessibility.smoothScrollTo(element);

      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: "nearest",
        inline: "nearest",
      });
    });
  });

  describe("Comprehensive Accessibility Testing", () => {
    it("should run complete accessibility audit", async () => {
      // Create a test page with various accessibility issues
      container.innerHTML = `
        <h1>Main Title</h1>
        <h3>Skipped H2</h3>
        <img src="test.jpg" />
        <button></button>
        <a href="#">Generic link</a>
        <form>
          <input type="text" />
        </form>
        <table>
          <tr><td>No headers</td></tr>
        </table>
      `;

      const results = await runAccessibilityTests(container);

      expect(results).toHaveProperty("audit");
      expect(results).toHaveProperty("keyboard");
      expect(results).toHaveProperty("screenReader");
      expect(results).toHaveProperty("summary");

      // Should find accessibility issues
      expect(results.audit.errors.length).toBeGreaterThan(0);
      expect(results.summary.score).toBeLessThan(100);
    });

    it("should pass audit for accessible content", async () => {
      // Create accessible content
      container.innerHTML = `
        <main>
          <h1>Accessible Page</h1>
          <h2>Section Title</h2>
          <img src="test.jpg" alt="Descriptive alt text" />
          <button aria-label="Close dialog">×</button>
          <a href="/page">Descriptive link text</a>
          <form>
            <label for="name">Name:</label>
            <input type="text" id="name" />
          </form>
          <table>
            <caption>Data table</caption>
            <thead>
              <tr><th>Header</th></tr>
            </thead>
            <tbody>
              <tr><td>Data</td></tr>
            </tbody>
          </table>
        </main>
      `;

      const results = await runAccessibilityTests(container);

      // Should have fewer issues
      expect(results.summary.score).toBeGreaterThan(80);
    });

    it("should test keyboard navigation flow", async () => {
      container.innerHTML = `
        <button id="btn1">Button 1</button>
        <input id="input1" type="text" />
        <a id="link1" href="#">Link 1</a>
        <button id="btn2">Button 2</button>
      `;

      const results = await runAccessibilityTests(container);

      expect(results.keyboard.focusableElements.length).toBe(4);
      expect(results.keyboard.tabOrder).toHaveLength(4);
    });

    it("should identify screen reader content", async () => {
      container.innerHTML = `
        <div aria-live="polite" id="status">Status updates</div>
        <h1 aria-label="Custom heading">Heading</h1>
        <main aria-labelledby="main-title">
          <h2 id="main-title">Main Content</h2>
        </main>
        <nav aria-label="Main navigation">
          <ul><li><a href="#">Home</a></li></ul>
        </nav>
      `;

      const results = await runAccessibilityTests(container);

      expect(results.screenReader.liveRegions.length).toBe(1);
      expect(results.screenReader.landmarks.length).toBe(2); // main and nav
      expect(results.screenReader.headings.length).toBe(2);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing elements gracefully", () => {
      expect(() => {
        focusManagement.getFocusableElements(null);
      }).not.toThrow();

      expect(() => {
        ariaUtils.setAttributes(null, { "aria-label": "test" });
      }).not.toThrow();
    });

    it("should handle invalid ARIA values", () => {
      const element = mockElement("div");

      expect(() => {
        ariaUtils.setAttributes(element, {
          "aria-expanded": "invalid",
          "aria-hidden": "maybe",
        });
      }).not.toThrow();

      expect(element.getAttribute("aria-expanded")).toBe("invalid");
      expect(element.getAttribute("aria-hidden")).toBe("maybe");
    });
  });
});
