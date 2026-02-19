import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      },
    );

    const data = await response.json();

    if (response.ok && data.success) {
      const token = data.data.accessToken;
      const cookieStore = await cookies();
      cookieStore.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      });

      return NextResponse.json({ message: "Logged in successfully" });
    } else {
      return NextResponse.json(
        { message: data.message || "Invalid credentials" },
        { status: response.status || 401 },
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Login bridge error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 },
    );
  }
}
