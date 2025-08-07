import React from "react";
import { useAccessibility } from "../hooks/useAccessibility";

const SkipLinks = ({ links = [] }) => {
  const { keyboardNavigation, announce } = useAccessibility();

  // Default skip links
  const defaultLinks = [
    { href: "#main-content", label: "Skip to main content" },
    { href: "#navigation", label: "Skip to navigation" },
    { href: "#footer", label: "Skip to footer" },
  ];

  const allLinks = links.length > 0 ? links : defaultLinks;

  const handleSkipClick = (e, label) => {
    const target = document.querySelector(e.target.getAttribute("href"));
    if (target) {
      // Focus the target element
      target.focus();
      // If target is not focusable, make it focusable temporarily
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
        target.addEventListener(
          "blur",
          () => {
            target.removeAttribute("tabindex");
          },
          { once: true }
        );
      }

      announce(`Skipped to ${label.toLowerCase()}`);
    }
  };

  // Only show skip links when keyboard navigation is detected
  if (!keyboardNavigation) {
    return null;
  }

  return (
    <div className="skip-links">
      {allLinks.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="
            absolute left-4 top-4 z-[9999]
            px-4 py-2 bg-primary text-white text-sm font-medium
            rounded-lg shadow-lg
            transform -translate-y-full opacity-0
            focus:translate-y-0 focus:opacity-100
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary
          "
          onClick={(e) => handleSkipClick(e, link.label)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSkipClick(e, link.label);
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

export default SkipLinks;
