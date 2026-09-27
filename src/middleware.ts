import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match internationalized pathnames, skipping internal Next assets and public static files
  matcher: ["/", "/(it|en)/:path*", "/((?!_next|_vercel|images|.*\\..*).*)"],
};
