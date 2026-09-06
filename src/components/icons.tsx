import type { ReactNode } from "react";

function mk(node: ReactNode, filled = false) {
  return function Icon({ size = 18, className = "" }: { size?: number; className?: string }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={filled ? "currentColor" : "none"}
        stroke={filled ? "none" : "currentColor"}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {node}
      </svg>
    );
  };
}

export const IcDash = mk(
  <>
    <rect x="3.5" y="3.5" width="7" height="9" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="5" rx="1.6" />
    <rect x="13.5" y="11.5" width="7" height="9" rx="1.6" />
    <rect x="3.5" y="15.5" width="7" height="5" rx="1.6" />
  </>
);
export const IcCal = mk(
  <>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    <path d="M8 13.5h3M8 16.8h5.5" />
  </>
);
export const IcUsers = mk(
  <>
    <circle cx="9" cy="8.2" r="3.4" />
    <path d="M3.2 20c.6-3.4 2.9-5.3 5.8-5.3s5.2 1.9 5.8 5.3" />
    <path d="M15.4 5.2a3.4 3.4 0 010 6.1M17.7 14.9c1.7.8 2.8 2.5 3.1 5.1" />
  </>
);
export const IcMedal = mk(
  <>
    <circle cx="12" cy="8.6" r="4.6" />
    <path d="M9.4 12.6L7 20.5l3.4-1.8 1.6 2 1.6-2L17 20.5l-2.4-7.9" />
    <path d="M12 6.6l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z" />
  </>
);
export const IcGear = mk(
  <>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M12 2.8l1.2 2.6 2.8-.6 1 2.7 2.9.5-.6 2.8 2.1 2-2.1 2 .6 2.8-2.9.5-1 2.7-2.8-.6L12 21.2l-1.2-2.6-2.8.6-1-2.7-2.9-.5.6-2.8-2.1-2 2.1-2-.6-2.8 2.9-.5 1-2.7 2.8.6z" />
  </>
);
export const IcClock = mk(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.2V12l3.4 2.2" />
  </>
);
export const IcQr = mk(
  <>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
    <path d="M13.5 13.5h3v3h-3zM20.5 13.5v3M17 20.5h3.5M13.5 20.5v-2" />
  </>
);
export const IcIn = mk(
  <>
    <path d="M14 3.5H7A2.5 2.5 0 004.5 6v12A2.5 2.5 0 007 20.5h7" />
    <path d="M15.5 8l4 4-4 4M19 12H9.5" />
  </>
);
export const IcOut = mk(
  <>
    <path d="M10 3.5h7A2.5 2.5 0 0119.5 6v12a2.5 2.5 0 01-2.5 2.5h-7" />
    <path d="M8.5 8l-4 4 4 4M4.5 12H14" />
  </>
);
export const IcDown = mk(
  <>
    <path d="M12 3.5v11M7.5 10l4.5 4.5L16.5 10" />
    <path d="M4.5 16.5v2A2 2 0 006.5 20.5h11a2 2 0 002-2v-2" />
  </>
);
export const IcSearch = mk(
  <>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M15.2 15.2L20.5 20.5" />
  </>
);
export const IcX = mk(<path d="M6 6l12 12M18 6L6 18" />);
export const IcPencil = mk(
  <>
    <path d="M4 20l.9-3.8L16.4 4.7a1.9 1.9 0 012.7 0l.2.2a1.9 1.9 0 010 2.7L7.8 19.1z" />
    <path d="M14.5 6.5l3 3" />
  </>
);
export const IcPlus = mk(<path d="M12 5v14M5 12h14" />);
export const IcChevR = mk(<path d="M9.5 5.5L16 12l-6.5 6.5" />);
export const IcBack = mk(<path d="M14.5 5.5L8 12l6.5 6.5" />);
export const IcLogout = mk(
  <>
    <path d="M10 3.5H7A2.5 2.5 0 004.5 6v12A2.5 2.5 0 007 20.5h3" />
    <path d="M16 8l4 4-4 4M20 12H9.5" />
  </>
);
export const IcMail = mk(
  <>
    <rect x="3.5" y="5" width="17" height="14" rx="2" />
    <path d="M4.5 7.5l7.5 5.5 7.5-5.5" />
  </>
);
export const IcShield = mk(
  <>
    <path d="M12 3.2l7 2.6v5.6c0 4.6-3 7.6-7 9.4-4-1.8-7-4.8-7-9.4V5.8z" />
    <path d="M9 11.6l2.1 2.2L15.2 9.5" />
  </>
);
export const IcSpark = mk(
  <>
    <path d="M12 3.5l1.9 5.4 5.6 1.6-5.6 1.6L12 17.5l-1.9-5.4-5.6-1.6 5.6-1.6z" />
    <path d="M19 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
  </>
);
export const IcPin = mk(
  <>
    <path d="M12 21s6.5-5.6 6.5-10.4a6.5 6.5 0 10-13 0C5.5 15.4 12 21 12 21z" />
    <circle cx="12" cy="10.4" r="2.3" />
  </>
);
export const IcRepeat = mk(
  <>
    <path d="M17 4.5l3 3-3 3" />
    <path d="M4 12V9.5A2.5 2.5 0 016.5 7H20" />
    <path d="M7 19.5l-3-3 3-3" />
    <path d="M20 12v2.5a2.5 2.5 0 01-2.5 2.5H4" />
  </>
);
export const IcTrash = mk(
  <>
    <path d="M4.5 6.5h15M9.5 6V4.5a1 1 0 011-1h3a1 1 0 011 1V6" />
    <path d="M6.5 6.5l.8 12.5a1.6 1.6 0 001.6 1.5h6.2a1.6 1.6 0 001.6-1.5l.8-12.5" />
    <path d="M10 10.5v6M14 10.5v6" />
  </>
);
export const IcMenu = mk(<path d="M4 7h16M4 12h16M4 17h10" />);
export const IcUser = mk(
  <>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5 20.4c.7-3.8 3.3-5.9 7-5.9s6.3 2.1 7 5.9" />
  </>
);
export const IcCheck = mk(<path d="M4.5 12.5l5 5L19.5 7" />);
export const IcInfo = mk(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.2M12 7.6v.2" />
  </>
);
export const IcEye = mk(
  <>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </>
);
export const IcLock = mk(
  <>
    <rect x="5.5" y="10.5" width="13" height="10" rx="2" />
    <path d="M8.5 10.5V7.8a3.5 3.5 0 017 0v2.7" />
    <path d="M12 14.5v2.5" />
  </>
);
export const IcDoc = mk(
  <>
    <path d="M6 3.5h8l4 4V20a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 016 20z" />
    <path d="M14 3.5v4h4" />
    <path d="M9 12h6M9 15.2h6M9 18.4h3.5" />
  </>
);
export const IcScan = mk(
  <>
    <path d="M3.5 8V5.5a2 2 0 012-2H8M16 3.5h2.5a2 2 0 012 2V8M20.5 16v2.5a2 2 0 01-2 2H16M8 20.5H5.5a2 2 0 01-2-2V16" />
    <path d="M3.5 12h17" />
  </>
);
export const IcHome = mk(
  <>
    <path d="M4 11l8-7 8 7" />
    <path d="M6 9.5V20h12V9.5" />
    <path d="M10 20v-5.5h4V20" />
  </>
);
export const IcWave = mk(
  <path d="M3 14.5c2-3 4-3 6 0s4 3 6 0 4-3 6 0M3 9.5c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
);
export const IcCard = mk(
  <>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="M3 10h18M6.5 14.5h4" />
  </>
);
export const IcRefund = mk(
  <>
    <path d="M4 9.5h11a4.5 4.5 0 010 9H8" />
    <path d="M8 5.5l-4 4 4 4" />
  </>
);
export const IcLeaf = mk(
  <>
    <path d="M19.5 4.5c-8.5 0-13 4.5-13 10 0 2.6 1.6 4.6 4 5 6.5-1 10-6 9-15z" />
    <path d="M5 20.5C8 14 12 10 17 7.5" />
  </>
);
export const IcRocket = mk(
  <>
    <path d="M12 15.5c5.5-4.5 7-9.5 7.2-11.7-2.2.2-7.2 1.7-11.7 7.2" />
    <path d="M7.5 11L4 12.2l3.3 2M13 16.5l-1.2 3.5-2-3.3" />
    <path d="M7.5 11l5.5 5.5" />
    <circle cx="14.8" cy="9.2" r="1.5" />
    <path d="M5.5 18.5c-.8.8-1.2 2-1 3 1-.2 2.2-.2 3-1" />
  </>
);
export const IcCopy = mk(
  <>
    <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
    <path d="M15.5 5.5v-.4A2.1 2.1 0 0013.4 3H5.1A2.1 2.1 0 003 5.1v8.3a2.1 2.1 0 002.1 2.1h.4" />
  </>
);
export const IcTerminal = mk(
  <>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <path d="M7 9.5l3 2.8-3 2.8M12.5 15.5h4.5" />
  </>
);

/* Organization logo marks — white-label presets */
export function LogoMark({ variant, size = 26, fg = "var(--acc)", bg = "transparent" }: { variant: number; size?: number; fg?: string; bg?: string }) {
  const common = { width: size, height: size, viewBox: "0 0 32 32", "aria-hidden": true as const };
  const marks = [
    // sunrise over river bend
    <svg key="0" {...common}>
      <rect width="32" height="32" rx="8" fill={bg === "transparent" ? "#113129" : bg} />
      <path d="M8 18a8 8 0 0116 0z" fill={fg} />
      <path d="M6 22c3-2 5-2 7 0s4 2 6 0 4-2 7 0" stroke={fg} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M16 6v3M24.5 9.5l-2 2M7.5 9.5l2 2" stroke={fg} strokeWidth="2.2" strokeLinecap="round" />
    </svg>,
    // handshake chevron
    <svg key="1" {...common}>
      <rect width="32" height="32" rx="8" fill={bg === "transparent" ? "#113129" : bg} />
      <path d="M7 19l5-5 4 4 5-5" stroke={fg} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 25l5-5 4 4 5-5" stroke={fg} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
    </svg>,
    // leaf check
    <svg key="2" {...common}>
      <rect width="32" height="32" rx="8" fill={bg === "transparent" ? "#113129" : bg} />
      <path d="M24 8c-9 0-14 4.5-14 11 0 2.4 1.6 4 3.8 4.2C21 22 25 17 24 8z" fill="none" stroke={fg} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M12.5 16.5l3 3 6-7" stroke={fg} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,
    // star compass
    <svg key="3" {...common}>
      <rect width="32" height="32" rx="8" fill={bg === "transparent" ? "#113129" : bg} />
      <path d="M16 6l2.6 7.4L26 16l-7.4 2.6L16 26l-2.6-7.4L6 16l7.4-2.6z" fill={fg} />
    </svg>,
  ];
  return marks[Math.abs(variant) % marks.length];
}
