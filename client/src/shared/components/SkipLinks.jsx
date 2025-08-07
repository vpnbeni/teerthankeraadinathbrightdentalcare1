import React from "react";
import { useAccessibility } from "../hooks";

const SkipLinks = () => {
  const { skipLinks } = useAccessibility();

  if (!skipLinks) return null;

  const skipLinkItems = [
    { href: "#main-content", label: "Skip to main content" },
    { href: "#navigation", label: "Skip to navigation" },
    { href: "#footer", label: "Skip to footer" },
  ];

  return (
    <div className="skip-links">
      {skipLinkItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="
            sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
            bg-blue-600 text-white px-4 py-2 rounded-md z-50
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-all duration-200
          "
          onClick={(e) => {
            e.preventDefault();
            const target = document.querySelector(item.href);
            if (target) {
              target.focus();
              target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
        >
          {item.label}
        </a>
      ))}
    </div>
  );
};

export default SkipLinks;
