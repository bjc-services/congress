"use client";

import { useEffect, useState } from "react";

export function SquareLogo({
  className,
  "aria-label": ariaLabel,
}: {
  className?: string;
  "aria-label"?: string;
}) {
  const [svgContent, setSvgContent] = useState<string>("");

  useEffect(() => {
    fetch("/square-logo.svg")
      .then((res) => res.text())
      .then((text) => setSvgContent(text))
      .catch(() => {
        // Fallback to empty if fetch fails
      });
  }, []);

  if (!svgContent) {
    return (
      <img
        src="/square-logo.svg"
        alt={ariaLabel || ""}
        className={className}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: svgContent }}
      aria-label={ariaLabel}
    />
  );
}
