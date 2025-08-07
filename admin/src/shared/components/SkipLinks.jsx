/**
 * Skip Links Component
 * Provides keyboard navigation shortcuts for accessibility
 */

import React from "react";

const SkipLinks = () => {
  const skipLinks = [
    {
      href: "#main-content",
      label: "Skip to main content",
    },
    {
      href: "#sidebar",
      label: "Skip to navigation",
    },
    {
      href: "#user-details-title",
      label: "Skip to page title",
    },
  ];

  return (
    <div className="skip-links" role="navigation" aria-label="Skip links">
      {skipLinks.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="skip-link admin-focus"
          onClick={(e) => {
            e.preventDefault();
            const target = document.querySelector(link.href);
            if (target) {
              target.focus();
              target.scrollIntoView({ behavior: "smooth", block: "start" });
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
