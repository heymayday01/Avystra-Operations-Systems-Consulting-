interface AvystraLogoProps {
  className?: string;
  /** Show just the A icon (for loading screen) */
  iconOnly?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Include "Pvt. Ltd." subtitle below the logo (navbar) */
  showSubtitle?: boolean;
  /** Include "Think Clearly, Act Decisively" tagline (footer — already in image) */
  showTagline?: boolean;
  /** light = dark logo on light bg, dark = white logo on dark bg */
  theme?: "light" | "dark";
}

/**
 * AVYSTRA brand logo component using the official brand asset.
 *
 * The new logo image (avystra-logo-new.png) contains:
 * - Stylized "A" icon with gold star
 * - "AVYSTRA" wordmark (gold + navy letters)
 * - "Think Clearly, Act Decisively" tagline with decorative lines
 *
 * Props:
 * - iconOnly       → just the A mark (loading screen) — uses old icon crop
 * - showSubtitle   → adds "Pvt. Ltd." text below (navbar)
 * - showTagline    → uses full logo with tagline (footer — image already has it)
 * - theme="dark"   → uses white logo variant for dark backgrounds
 */
export default function AvystraLogo({
  className = "",
  iconOnly = false,
  size = "md",
  showSubtitle = false,
  showTagline = false,
  theme = "light",
}: AvystraLogoProps) {
  const isDark = theme === "dark";

  // Select the right image
  const logoSrc = isDark
    ? iconOnly
      ? "/avystra-logo-icon-white.webp"
      : "/avystra-logo-new-white.webp"
    : iconOnly
      ? "/avystra-logo-icon.webp"
      : "/avystra-logo-new.webp";

  // Height presets for each size
  const heights: Record<string, number> = {
    sm: 40,
    md: 44,
    lg: 72,
    xl: 100,
  };
  const baseHeight = heights[size];

  // For iconOnly, the image is roughly square
  if (iconOnly) {
    const h = baseHeight;
    const w = Math.round(h * 1.0);
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height: h }}
      >
        <img
          src={logoSrc}
          alt="AVYSTRA"
          className="shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
          style={{ height: `${h}px`, width: `${w}px` }}
        />
      </div>
    );
  }

  // The new logo image is 1600×1278 → aspect ratio ~1.25
  // For navbar (sm): use just the wordmark portion (top ~55% of image)
  // For footer (lg with showTagline): use the full image
  const aspectRatio = 1.25; // 1600/1278
  const imgHeight = baseHeight;
  const imgWidth = Math.round(imgHeight * aspectRatio);

  return (
    <div className={`flex items-center ${className}`} style={{ height: "auto" }}>
      <div className="flex flex-col items-center leading-none">
        <img
          src={logoSrc}
          alt="AVYSTRA Consulting Pvt. Ltd."
          className="shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
          style={{ height: `${imgHeight}px`, width: "auto" }}
        />
        {showSubtitle && (
          <span
            className={`font-sans font-medium tracking-wide mt-0.5 select-none ${
              isDark ? "text-slate-300" : "text-navy-deep/70"
            }`}
            style={{
              fontSize: `${baseHeight * 0.18}px`,
              letterSpacing: "0.12em",
            }}
          >
            Consulting Pvt. Ltd.
          </span>
        )}
      </div>
    </div>
  );
}
