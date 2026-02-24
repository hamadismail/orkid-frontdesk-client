import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://orkidfrontdesk-server.vercel.app/api/v1";

const forwardRequest = async (
  req: NextRequest,
  pathSegments: string[],
  method: string,
) => {
  try {
    const targetUrl = new URL(
      `${BACKEND_API_URL.replace(/\/$/, "")}/${pathSegments.join("/")}`,
    );

    req.nextUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
    });

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const headers = new Headers();
    headers.set("Accept", "application/json");

    const contentType = req.headers.get("content-type");
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

    if (method !== "GET" && method !== "HEAD") {
      const body = await req.text();
      if (body) {
        init.body = body;
      }
    }

    const response = await fetch(targetUrl.toString(), init);
    const responseBody = await response.text();

    const proxyResponse = new NextResponse(responseBody, {
      status: response.status,
    });

    const responseContentType = response.headers.get("content-type");
    if (responseContentType) {
      proxyResponse.headers.set("Content-Type", responseContentType);
    }

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
