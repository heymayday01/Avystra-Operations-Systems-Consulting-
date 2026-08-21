"use client";

import * as React from "react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useAnimate, useReducedMotion, type Transition } from "motion/react";

/**
 * ArrowRevealButton — premium button with an expanding circular badge.
 *
 * On hover:
 * - The circular badge scales up to cover the entire pill (smooth reveal)
 * - The icon travels to the button center + rotates (direction configurable)
 * - The text label shifts slightly in the opposite direction
 * On press: the whole pill scales to 0.97 (tactile feedback)
 *
 * Design: Originkit ArrowRevealButton — integrated with AVYSTRA's design
 * system (gold + navy palette, JetBrains Mono labels, premium easings).
 */

type Colors = {
  fill?: string;
  textColor?: string;
  hoverFill?: string;
  hoverTextColor?: string;
};

export type IconConfig = {
  type?: "icon" | "symbol" | "image";
  icon?:
    | "arrow"
    | "chevron"
    | "plus"
    | "star"
    | "arrowDiagonal"
    | "check"
    | string
    | React.ReactNode;
  symbol?: string;
  image?: string | { src?: string; srcSet?: string; alt?: string };
  background?: string;
  color?: string;
  badgeSize?: number;
  size?: number;
  iconSize?: number;
  padding?: number;
  rounded?: number;
  inset?: number;
  badgeInset?: number;
  direction?: number | string;
  restAngle?: number | string;
  hoverAngle?: number | string;
  side?: "left" | "right";
  position?: "left" | "right";
};

type Props = {
  colors?: Colors;
  label?: string;
  font?: React.CSSProperties;
  padding?: string;
  rounded?: number;
  fill?: string;
  textColor?: string;
  border?: React.CSSProperties;
  icon?: IconConfig;
  arrow?: IconConfig;
  gap?: number;
  link?: string;
  transition?: Transition;
  newTab?: boolean;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler;
  ariaLabel?: string;
};

const borderWidthOf = (b: React.CSSProperties | undefined): number => {
  if (!b) return 0;
  if (typeof b === "number") return b;
  const num = (v: any) => {
    if (typeof v === "number") return v;
    const parsed = parseFloat(String(v ?? ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const sides = [
    (b as any).borderTopWidth,
    (b as any).borderRightWidth,
    (b as any).borderBottomWidth,
    (b as any).borderLeftWidth,
  ].filter((v) => v !== undefined && v !== null);
  if (sides.length) return Math.max(...sides.map(num));
  return num((b as any).borderWidth);
};

const radiusFromPercent = (w: number, h: number, pct: number) =>
  (Math.min(w, h) / 2) * (Math.max(0, Math.min(100, pct)) / 100);

const TWELVE_ANGLES: Record<string, number> = {
  "0": 0, "30": 30, "60": 60, "90": 90, "120": 120, "150": 150,
  "180": 180, "210": 210, "240": 240, "270": 270, "300": 300, "330": 330,
  right: 0, downRight: 45, down: 90, downLeft: 135,
  left: 180, upLeft: 225, up: 270, upRight: 315,
};

type ArrowDirection = keyof typeof TWELVE_ANGLES | number;

const getAngleInDegrees = (
  dir: number | string | undefined,
  defaultVal = 0
): number => {
  if (dir === undefined || dir === null) return defaultVal;
  if (typeof dir === "number") return ((dir % 360) + 360) % 360;
  if (typeof dir === "string" && dir in TWELVE_ANGLES) {
    return TWELVE_ANGLES[dir];
  }
  const parsed = parseFloat(String(dir ?? ""));
  if (Number.isFinite(parsed)) return ((parsed % 360) + 360) % 360;
  return defaultVal;
};

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const ICON_STROKE_WIDTH = 2;

function renderIconPath(iconType: any, strokeWidth: number = ICON_STROKE_WIDTH) {
  if (React.isValidElement(iconType)) return iconType;

  const str = typeof iconType === "string" ? iconType.toLowerCase() : "arrow";

  switch (str) {
    case "chevron":
      return (
        <path
          d="M9 18L15 12L9 6"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case "plus":
      return (
        <path
          d="M12 5V19M5 12H19"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case "star":
      return (
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case "arrowdiagonal":
    case "arrow-diagonal":
      return (
        <path
          d="M7 17L17 7M17 7H7M17 7V17"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case "check":
      return (
        <path
          d="M20 6L9 17L4 12"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case "arrow":
    default:
      return (
        <path
          d="M5 12H19M19 12L13 6M19 12L13 18"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
  }
}

export default function ArrowRevealButton(props: Props) {
  const {
    label = "BUTTON",
    font,
    padding = "16px 32px 16px 16px",
    rounded = 100,
    fill: fillProp,
    textColor: textColorProp,
    colors = { fill: "#0B1B2E", textColor: "#FFFFFF" },
    border = {
      borderColor: "rgba(184, 146, 78, 0.3)",
      borderStyle: "solid",
      borderWidth: 1,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
    },
    icon: iconProps = {
      side: "left",
      size: 32,
      type: "icon",
      icon: "arrow",
      color: "#0B1B2E",
      background: "#B8924E",
      padding: 16,
      rounded: 100,
      restAngle: 0,
      hoverAngle: 45,
    },
    arrow: arrowProps,
    gap = 16,
    link = "",
    transition = {
      ease: [0.44, 0, 0.56, 1] as [number, number, number, number],
      type: "tween",
      delay: 0,
      duration: 0.46,
    } as Transition,
    newTab = false,
    style,
    onClick,
    ariaLabel,
  } = props;

  const fill = colors?.fill ?? fillProp ?? "#0B1B2E";
  const textColor = colors?.textColor ?? textColorProp ?? "#FFFFFF";

  const iconObj: IconConfig = iconProps || arrowProps || {};

  const {
    type: iconKind = "icon",
    icon: iconType = "arrow",
    symbol: iconSymbol = "→",
    image: iconImage,
    background: iconBackground = "#B8924E",
    color: iconColor = "#0B1B2E",
    badgeSize: badgeSizePropIn,
    size: sizeProp,
    iconSize: iconSizeProp,
    padding: iconPadding = 16,
    rounded: iconRounded = 100,
    inset: insetProp,
    badgeInset: badgeInsetProp,
    direction: iconDirection = 0,
    restAngle: restAngleProp,
    hoverAngle: hoverAngleProp,
    side: iconSideProp,
    position: iconPositionLegacy,
  } = iconObj;

  const iconPosition = iconSideProp ?? iconPositionLegacy ?? "left";

  const iconSrc =
    typeof iconImage === "string"
      ? iconImage
      : iconImage && (iconImage as any).src
        ? (iconImage as any).src
        : "";
  const kind = iconKind === "image" && !iconSrc ? "icon" : iconKind;

  const badgeInset = insetProp ?? badgeInsetProp ?? 0;
  const bWidth = borderWidthOf(border);
  const effectiveInset = badgeInset;

  const Tag: any = link ? "a" : "button";
  const tagProps = link
    ? {
        href: link,
        target: newTab ? "_blank" : undefined,
        rel: newTab ? "noopener noreferrer" : undefined,
      }
    : { type: "button" as const };

  const [scope, animate] = useAnimate();
  const buttonRef = useRef<HTMLElement>(null);
  const strokeRef = useRef<HTMLSpanElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const hovered = useRef(false);
  const metrics = useRef({ hoverScale: 1, hoverX: 0 });
  const reducedMotion = useReducedMotion();

  const iconSize = Math.max(1, Math.round(iconSizeProp ?? sizeProp ?? 40));

  const badgeSizeProp =
    badgeSizePropIn !== undefined
      ? Math.max(1, Math.round(badgeSizePropIn))
      : Math.max(1, Math.round(iconSize + 2 * iconPadding));

  const dirAngle = getAngleInDegrees(iconDirection, 0);
  const restAngleVal = getAngleInDegrees(restAngleProp, dirAngle);
  const hoverAngleVal = getAngleInDegrees(hoverAngleProp, dirAngle + 45);

  const iconRadius = `${Math.max(0, Math.min(100, Math.round(iconRounded))) / 2}%`;
  const isLeft = iconPosition === "left";

  useEffect(() => {
    if (!hovered.current && arrowRef.current) {
      animate(arrowRef.current, { rotate: restAngleVal }, { duration: 0 });
    }
  }, [restAngleVal, animate]);

  useIsoLayoutEffect(() => {
    const btn = buttonRef.current;
    const badge = badgeRef.current;
    const arrow = arrowRef.current;
    const slot = slotRef.current;
    const strokeEl = strokeRef.current;
    if (!btn || !badge || !arrow || !slot) return;

    const measure = () => {
      const w = btn.offsetWidth;
      const h = btn.offsetHeight;
      if (!w || !h) return;

      const radius = radiusFromPercent(w, h, rounded);
      (btn as HTMLElement).style.borderRadius = `${radius}px`;
      if (strokeEl) strokeEl.style.borderRadius = `${radius + bWidth}px`;

      const room = Math.min(h, w) - 2 * effectiveInset;
      if (room <= 0) return;
      const badgeSize = Math.min(badgeSizeProp, room);
      const rb = badgeSize / 2;

      const rawCx = slot.offsetLeft + slot.offsetWidth / 2;
      const cy = slot.offsetTop + slot.offsetHeight / 2;

      const fromEdge = Math.max(effectiveInset + rb, radius);
      const cx = Math.min(Math.max(rawCx, fromEdge), w - fromEdge);

      const far = Math.hypot(
        Math.max(cx, w - cx),
        Math.max(cy, h - cy)
      );
      const coverD = Math.ceil(2 * far * 1.02);

      const arrowSize = Math.min(
        iconSize,
        Math.floor(badgeSize / Math.SQRT2)
      );

      metrics.current = {
        hoverScale: badgeSize > 0 ? coverD / badgeSize : 1,
        hoverX: w / 2 - cx,
      };

      badge.style.width = `${badgeSize}px`;
      badge.style.height = `${badgeSize}px`;
      badge.style.left = `${cx}px`;
      badge.style.top = `${cy}px`;
      badge.style.marginLeft = `${-rb}px`;
      badge.style.marginTop = `${-rb}px`;

      arrow.style.width = `${arrowSize}px`;
      arrow.style.height = `${arrowSize}px`;
      arrow.style.fontSize = `${arrowSize}px`;
      arrow.style.marginLeft = `${-arrowSize / 2}px`;
      arrow.style.marginTop = `${-arrowSize / 2}px`;
      arrow.style.left = `${cx}px`;
      arrow.style.top = `${cy}px`;
      arrow.style.right = "auto";

      if (!hovered.current) {
        animate(badge, { scale: 1 }, { duration: 0 });
        animate(arrow, { x: 0, rotate: restAngleVal }, { duration: 0 });
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(btn);
    ro.observe(slot);
    return () => ro.disconnect();
  }, [
    animate, gap, badgeSizeProp, iconSize, padding, isLeft, rounded,
    restAngleVal, effectiveInset, bWidth,
  ]);

  const opts = () => (reducedMotion ? { duration: 0 } : transition);

  const pressTo = (s: number) => {
    if (buttonRef.current)
      animate(buttonRef.current as HTMLElement, { scale: s } as any, opts() as any);
    if (strokeRef.current)
      animate(strokeRef.current, { scale: s } as any, opts() as any);
  };

  const onEnter = () => {
    hovered.current = true;
    animate(badgeRef.current!, { scale: metrics.current.hoverScale } as any, opts() as any);
    animate(
      arrowRef.current!,
      { x: metrics.current.hoverX, rotate: hoverAngleVal } as any,
      opts() as any
    );
    if (textRef.current) {
      animate(textRef.current, { x: isLeft ? 8 : -8 } as any, opts() as any);
    }
  };

  const onLeave = () => {
    hovered.current = false;
    animate(badgeRef.current!, { scale: 1 } as any, opts() as any);
    animate(
      arrowRef.current!,
      { x: 0, rotate: restAngleVal } as any,
      opts() as any
    );
    if (textRef.current) {
      animate(textRef.current, { x: 0 } as any, opts() as any);
    }
    pressTo(1);
  };

  const glyph =
    kind === "image" ? (
      <img
        src={iconSrc}
        alt=""
        aria-hidden
        draggable={false}
        style={{
          width: "100%", height: "100%",
          objectFit: iconRounded > 0 ? "cover" : "contain",
          borderRadius: iconRadius, display: "block", pointerEvents: "none",
        }}
      />
    ) : kind === "symbol" ? (
      <span style={{
        display: "block", fontSize: "100%", lineHeight: 1,
        color: iconColor, whiteSpace: "nowrap",
      }}>
        {iconSymbol}
      </span>
    ) : (
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {renderIconPath(iconType)}
      </svg>
    );

  return (
    <div
      ref={scope}
      style={{
        display: "inline-flex",
        minWidth: 80, minHeight: 40,
        position: "relative", overflow: "visible",
        ...style,
      }}
    >
      <Tag
        {...tagProps}
        ref={buttonRef}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        onPointerDown={() => pressTo(0.97)}
        onPointerUp={() => pressTo(1)}
        onClick={onClick}
        aria-label={ariaLabel || label}
        style={{
          boxSizing: "border-box",
          flex: "1 1 auto",
          display: "flex",
          alignItems: "center",
          flexDirection: isLeft ? "row-reverse" : "row",
          justifyContent: "space-between",
          gap,
          padding,
          background: fill,
          border: "none",
          overflow: "hidden",
          position: "relative",
          cursor: "pointer",
          textDecoration: "none",
          whiteSpace: "nowrap",
          userSelect: "none",
          boxShadow: "0 4px 16px -4px rgba(11, 27, 46, 0.20)",
        }}
      >
        <span
          ref={textRef}
          style={{
            position: "relative", zIndex: 1,
            color: textColor, opacity: 1,
            ...font,
          }}
        >
          {label}
        </span>

        <span
          ref={slotRef}
          aria-hidden
          style={{ flex: "none", width: badgeSizeProp, height: badgeSizeProp }}
        />

        <div
          ref={badgeRef}
          aria-hidden
          style={{
            position: "absolute", zIndex: 2,
            width: 0, height: 0,
            borderRadius: iconRadius,
            background: iconBackground,
            transformOrigin: "center",
            pointerEvents: "none",
          }}
        />

        <div
          ref={arrowRef}
          aria-hidden
          style={{
            position: "absolute", zIndex: 3,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: iconColor, pointerEvents: "none",
          }}
        >
          {glyph}
        </div>
      </Tag>

      <span
        ref={strokeRef}
        aria-hidden
        style={{
          position: "absolute", inset: -bWidth,
          zIndex: 4, boxSizing: "border-box",
          pointerEvents: "none",
          ...(border as React.CSSProperties),
        }}
      />
    </div>
  );
}
