import { auth } from "@/lib/auth";

export default auth;

export const config = {
  matcher: ["/((?!api/auth|api/mcp|\\.well-known|_next/static|_next/image|favicon.ico|manifest.json|icons).*)"],
};
