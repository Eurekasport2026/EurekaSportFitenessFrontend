import type { SVGProps } from "react";

export type SocialNetwork = "facebook" | "instagram" | "youtube" | "tiktok" | "linkedin";

export function SocialIcon({ network, ...props }: SVGProps<SVGSVGElement> & { network: SocialNetwork }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      {network === "facebook" && <path fill="currentColor" d="M14.9 21v-8.2h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.5 1.6-1.5h1.7V3.1c-.3 0-1.3-.1-2.5-.1-2.7 0-4.5 1.6-4.5 4.6v2H8.4v3.2h2.8V21h3.7Z" />}
      {network === "instagram" && <g stroke="currentColor" strokeWidth="1.9"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.1" /><circle cx="17.4" cy="6.7" r=".9" fill="currentColor" stroke="none" /></g>}
      {network === "youtube" && <g><rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor" /><path d="m10 8.5 6 3.5-6 3.5v-7Z" fill="#09141d" /></g>}
      {network === "tiktok" && <path fill="currentColor" d="M14 2h3c.2 2.2 1.5 3.7 4 4v3.1c-1.5 0-2.8-.5-4-1.3V16a6 6 0 1 1-6-6h.6v3.2H11a2.8 2.8 0 1 0 2.8 2.8V2Z" />}
      {network === "linkedin" && <g fill="currentColor"><path d="M3.3 8.7h3.4V21H3.3zM5 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM9.3 8.7h3.3v1.7c.5-.9 1.6-2 3.5-2 3.7 0 4.4 2.4 4.4 5.5V21h-3.4v-6.3c0-1.5 0-3.3-2-3.3s-2.4 1.6-2.4 3.2V21H9.3V8.7Z" /></g>}
    </svg>
  );
}
