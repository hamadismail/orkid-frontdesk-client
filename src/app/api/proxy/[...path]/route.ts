import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://putrafrontdesk-server.vercel.app/api/v1";

const toProxyResponse = async (response: Response) => {
  const responseBody = await response.text();

  const proxyResponse = new NextResponse(responseBody, {
    status: response.status,
  });

  const responseContentType = response.headers.get("content-type");
  if (responseContentType) {
    proxyResponse.headers.set("Content-Type", responseContentType);
  }

  return proxyResponse;
};

const buildTargetUrl = (req: NextRequest, pathSegments: string[]) => {
  const targetUrl = new URL(
    `${BACKEND_API_URL.replace(/\/$/, "")}/${pathSegments.join("/")}`,
  );

  req.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  return targetUrl;
};

const requestBackend = async ({
  url,
  method,
  contentType,
  body,
  token,
}: {
  url: string;
  method: string;
  contentType: string | null;
  body: string | undefined;
  token?: string;
}) => {
  const headers = new Headers();
  headers.set("Accept", "application/json");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const init: RequestInit = {
    method,
    headers,
    cache: "no-store",
  };

  if (method !== "GET" && method !== "HEAD" && body) {
    init.body = body;
  }

  return fetch(url, init);
};

const refreshAccessToken = async (refreshToken: string) => {
  const response = await fetch(
    `${BACKEND_API_URL.replace(/\/$/, "")}/auth/refresh-token`,
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
};

const isRefreshEndpoint = (pathSegments: string[]) =>
  pathSegments[0] === "auth" && pathSegments[1] === "refresh-token";

const forwardRequest = async (
  req: NextRequest,
  pathSegments: string[],
  method: string,
) => {
  try {
    const targetUrl = buildTargetUrl(req, pathSegments);
    const cookieStore = await cookies();

    const accessToken = cookieStore.get("accessToken")?.value;
    const refreshToken = cookieStore.get("refreshToken")?.value;
    const contentType = req.headers.get("content-type");

    const body =
      method !== "GET" && method !== "HEAD" ? await req.text() : undefined;

    const firstResponse = await requestBackend({
      url: targetUrl.toString(),
      method,
      contentType,
      body,
      token: accessToken,
    });

    if (
      firstResponse.status !== 401 ||
      !refreshToken ||
      isRefreshEndpoint(pathSegments)
    ) {
      return toProxyResponse(firstResponse);
    }

    const newAccessToken = await refreshAccessToken(refreshToken);

    if (!newAccessToken) {
      const unauthorizedResponse = await toProxyResponse(firstResponse);
      unauthorizedResponse.cookies.delete("accessToken");
      unauthorizedResponse.cookies.delete("refreshToken");
      return unauthorizedResponse;
    }

    const retryResponse = await requestBackend({
      url: targetUrl.toString(),
      method,
      contentType,
      body,
      token: newAccessToken,
    });

    const proxyResponse = await toProxyResponse(retryResponse);
    proxyResponse.cookies.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return proxyResponse;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Proxy request failed",
      },
      { status: 500 },
    );
  }
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return forwardRequest(req, path, "GET");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return forwardRequest(req, path, "POST");
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return forwardRequest(req, path, "PATCH");
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return forwardRequest(req, path, "PUT");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return forwardRequest(req, path, "DELETE");
}
