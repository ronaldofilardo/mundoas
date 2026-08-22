import type { SVGProps } from "react";
import type { NavIconKey } from "@/lib/nav";

const baseProps: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  width: 18,
  height: 18,
  "aria-hidden": true,
};

export function NavIcon({ name }: { name: NavIconKey }) {
  switch (name) {
    case "dashboard":
      return (
        <svg {...baseProps}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case "users":
      return (
        <svg {...baseProps}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M16 13c2.8 0 5 2.2 5 5" />
        </svg>
      );
    case "upload":
      return (
        <svg {...baseProps}>
          <path d="M12 16V4" />
          <path d="m6 10 6-6 6 6" />
          <path d="M4 20h16" />
        </svg>
      );
    case "procedures":
      return (
        <svg {...baseProps}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 9h6M9 13h6M9 17h3" />
        </svg>
      );
    case "rules":
      return (
        <svg {...baseProps}>
          <path d="M4 6h10M4 12h7M4 18h12" />
          <circle cx="18" cy="6" r="2" />
        </svg>
      );
    case "reports":
      return (
        <svg {...baseProps}>
          <path d="M4 20V8" />
          <path d="M10 20V4" />
          <path d="M16 20v-8" />
          <path d="M3 20h18" />
        </svg>
      );
    case "payments":
      return (
        <svg {...baseProps}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 15h3" />
        </svg>
      );
    case "points":
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="1" />
        </svg>
      );
    case "production":
      return (
        <svg {...baseProps}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18" />
          <path d="M8 13h4M8 16h6" />
        </svg>
      );
    case "commissions":
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M14.5 9.5C14 8.5 13 8 12 8c-1.5 0-3 1-3 2.5S9.5 13 12 13s3 1 3 2.5S13.5 18 12 18c-1.2 0-2.2-.5-2.7-1.5" />
          <path d="M12 6v2M12 16v2" />
        </svg>
      );
    case "establishment":
      return (
        <svg {...baseProps}>
          <path d="M3 20V8l9-5 9 5v12" />
          <path d="M9 20v-6h6v6" />
          <path d="M3 20h18" />
        </svg>
      );
    case "productivity":
      return (
        <svg {...baseProps}>
          <path d="M3 17l5-5 4 4 8-9" />
          <path d="M14 7h6v6" />
        </svg>
      );
    case "profile":
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
        </svg>
      );
    case "partners":
      return (
        <svg {...baseProps}>
          <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" />
          <path d="M4 20c0-3.5 3-6 8-6s8 2.5 8 6" />
        </svg>
      );
    case "team":
      return (
        <svg {...baseProps}>
          <circle cx="8" cy="9" r="3" />
          <circle cx="16" cy="9" r="3" />
          <path d="M2 19c0-3 2.5-5 6-5s6 2 6 5" />
          <path d="M22 19c0-3-2.5-5-6-5" />
        </svg>
      );
    case "goals":
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" />
        </svg>
      );
    case "coupons":
      return (
        <svg {...baseProps}>
          <path d="M4 9V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3" />
          <path d="M3 9h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
          <path d="M9 9v13" />
        </svg>
      );
    case "audit":
      return (
        <svg {...baseProps}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
          <path d="M11 8v3l2 2" />
        </svg>
      );
    case "referrals":
      return (
        <svg {...baseProps}>
          <path d="M16 6a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" />
          <path d="M4 18c0-3 2.5-5 8-5s8 2 8 5" />
          <path d="m17 14 3 3-3 3" />
        </svg>
      );
    case "logout":
      return (
        <svg {...baseProps}>
          <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
          <path d="m16 8 4 4-4 4" />
          <path d="M20 12H10" />
        </svg>
      );
    default:
      return null;
  }
}
