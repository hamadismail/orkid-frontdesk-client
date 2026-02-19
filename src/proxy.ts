import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

  const { pathname } = req.nextUrl;

  if (!token) {
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  try {
    await jose.jwtVerify(token, secret);
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  } catch  {
    // Invalid token, redirect to login and delete the cookie
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("token");
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - img (image files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|img).*)",
  ],
};
