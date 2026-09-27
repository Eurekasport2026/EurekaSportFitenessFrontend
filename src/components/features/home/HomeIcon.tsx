import type { SVGProps } from "react";

export interface HomeIconProps extends SVGProps<SVGSVGElement> {
  name: "graduation" | "dumbbell" | "medal" | "people" | "growth" | "search" | "arrow" | "menu" | "close" | "certificate" | "practice" | "support" | "video" | "location" | "apple" | "playstore" | "mobile" | "clipboard" | "email" | "phone" | "clock";
}

export function HomeIcon({ name, ...props }: HomeIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      {name === "graduation" && <g fill="currentColor"><path d="M2 16 24 7l22 9-22 9L2 16Z" /><path d="M10 23v12l14 6 14-6V23l-14 6-14-6Z" /><path d="M43 20h2v14h-2zM42 33h4v5h-4z" /></g>}
      {name === "dumbbell" && <g fill="currentColor"><rect x="1" y="20" width="46" height="8" rx="2" /><rect x="5" y="12" width="5" height="24" rx="2" /><rect x="12" y="7" width="6" height="34" rx="2" /><rect x="30" y="7" width="6" height="34" rx="2" /><rect x="38" y="12" width="5" height="24" rx="2" /></g>}
      {name === "medal" && <g stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round"><path d="m24 5 5 3 6 1 2 6 3 5-3 5-2 6-6 1-5 3-5-3-6-1-2-6-3-5 3-5 2-6 6-1 5-3Z" /><circle cx="24" cy="20" r="6" /><path d="m16 32-3 12 7-3 4 4 3-10m5-3 3 12-7-3" /></g>}
      {name === "people" && <g fill="currentColor"><circle cx="24" cy="13" r="8" /><circle cx="8" cy="17" r="5" /><circle cx="40" cy="17" r="5" /><path d="M11 43V33c0-7 5-11 13-11s13 4 13 11v10H11ZM1 37v-7c0-5 3-8 8-8l5 1c-5 4-6 8-6 14H1Zm39 0c0-6-1-10-6-14l5-1c5 0 8 3 8 8v7h-7Z" /></g>}
      {name === "growth" && <g stroke="currentColor" strokeWidth="3" strokeLinejoin="round"><path d="M6 43V32h5v11M18 43V25h5v18M30 43V17h5v26" fill="currentColor" stroke="none" /><path d="m5 28 11-9 8 3L41 6m-11 1 12-2-1 12" /></g>}
      {name === "search" && <g stroke="currentColor" strokeWidth="4" strokeLinecap="round"><circle cx="21" cy="21" r="12" /><path d="m30 30 10 10" /></g>}
      {name === "arrow" && <path d="M9 24h29M26 12l12 12-12 12" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}
      {name === "menu" && <path d="M8 13h32M8 24h32M8 35h32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />}
      {name === "close" && <path d="m12 12 24 24m0-24L12 36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />}
      {name === "certificate" && <g stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round"><path d="M11 6h28v30h-8M11 6a5 5 0 0 0 0 10h3V6m-3 10v22H7a4 4 0 0 0 4 4h9M20 14h12m-12 7h9" /><circle cx="27" cy="32" r="6" /><path d="m23 37-2 8 6-3 6 3-2-8" /></g>}
      {name === "practice" && <g fill="currentColor"><circle cx="12" cy="10" r="5" /><circle cx="36" cy="10" r="5" /><path d="M6 18h12l-2 13 4 12h-7L9 31 6 43H1l4-15Zm24 0h12l1 11 4 14h-6l-3-12-3 12h-7l4-13Z" /><path d="M17 21h14v5H17zM21 6h6v10h-6zM21 32h6v10h-6z" /></g>}
      {name === "support" && <g><path d="M5 8h30a6 6 0 0 1 6 6v17a6 6 0 0 1-6 6H19L8 45V37H5a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4Z" fill="currentColor" /><path d="m13 22 7 6 12-13" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></g>}
      {name === "video" && <g><rect x="2" y="8" width="44" height="32" rx="6" fill="currentColor" /><path d="m20 16 13 8-13 8Z" fill="white" /></g>}
      {name === "location" && <path d="M39 19c0 12-15 26-15 26S9 31 9 19a15 15 0 1 1 30 0ZM19 18h10m-5-5v10" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />}
      {name === "apple" && <path fill="currentColor" d="M30 9c3-3 3-7 3-8-4 0-8 3-10 6-2 2-3 5-2 8 4 0 7-3 9-6Zm8 17c0-6 5-9 5-9-3-4-7-5-9-5-4 0-7 3-10 3s-5-3-9-2C9 13 4 18 4 25c0 5 2 11 5 16 2 3 5 7 8 6 3 0 4-2 8-2s5 2 8 2c4 0 6-3 8-6 2-3 3-6 4-8-4-2-7-4-7-7Z" />}
      {name === "playstore" && <g><path d="M5 3v42l22-21Z" fill="#27c5ed" /><path d="m5 3 28 16-6 5Z" fill="#45d984" /><path d="m27 24 6 5L5 45Z" fill="#f55667" /><path d="m33 19 10 5-10 5-6-5Z" fill="#ffd75b" /></g>}
      {name === "mobile" && <g stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><rect x="12" y="2" width="24" height="44" rx="4"/><path d="M19 7h10M22 40h4"/></g>}
      {name === "clipboard" && <g stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="7" width="32" height="38" rx="3"/><path d="M18 4h12v7H18zM16 20h15M16 28h15M16 36h9"/></g>}
      {name === "email" && <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="9" width="42" height="30" rx="3"/><path d="m5 12 19 15 19-15"/></g>}
      {name === "phone" && <path fill="currentColor" d="M12 3c-3 0-7 5-7 9 0 14 18 31 31 31 4 0 9-4 9-7 0-2-7-9-9-9-2 0-5 4-7 4-5 0-13-8-13-13 0-2 4-5 4-7 0-2-6-8-8-8Z" />}
      {name === "clock" && <g stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><circle cx="24" cy="24" r="19"/><path d="M24 12v13l8 5"/></g>}
    </svg>
  );
}
