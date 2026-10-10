import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // API endpoints must bypass locale redirects.
  matcher: ["/", "/(it|en)/:path*", "/((?!api|_next|_vercel|images|.*\\..*).*)"],
};
