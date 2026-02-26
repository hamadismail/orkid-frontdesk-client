import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://ecofrontdesk-server.vercel.app/api/v1";

const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "";

const refreshAccessToken = async (refreshToken: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/auth/refresh-token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      },
    );

    if (!response.ok) return null;

    const data = await response.json().catch(() => null);
    return (data?.data?.accessToken as string | undefined) || null;
  } catch {
    return null;
  }
};

const withNewAccessToken = (
  req: NextRequest,
  pathname: string,
  accessToken: string,
) => {
  const response =
    pathname === "/login"
      ? NextResponse.redirect(new URL("/", req.url))
      : NextResponse.next();

  response.cookies.set("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return response;
};

const redirectToLogin = (req: NextRequest) => {
  const response = NextResponse.redirect(new URL("/login", req.url));
  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");
  return response;
};

export async function proxy(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;
  const { pathname } = req.nextUrl;
  const secret = new TextEncoder().encode(ACCESS_SECRET);

  if (!ACCESS_SECRET) {
    return redirectToLogin(req);
  }

  if (!accessToken) {
    if (refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken);
      if (newAccessToken) {
        return withNewAccessToken(req, pathname, newAccessToken);
      }
      return redirectToLogin(req);
    }

    if (pathname !== "/login") {
      return redirectToLogin(req);
    }

    return NextResponse.next();
  }

  try {
    await jose.jwtVerify(accessToken, secret);
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  } catch {
    if (refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken);
      if (newAccessToken) {
        return withNewAccessToken(req, pathname, newAccessToken);
      }
    }

    return redirectToLogin(req);
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
