"use server";

import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://orkidfrontdesk-server.vercel.app/api/v1";

type AuthActionResult = {
  success: boolean;
  message: string;
};

export async function loginAction(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      return {
        success: false,
        message: data?.message || "Invalid credentials",
      };
    }

    const token = data?.data?.accessToken;

    if (!token) {
      return {
        success: false,
        message: "Authentication token was not returned",
      };
    }

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return {
      success: true,
      message: "Logged in successfully",
    };
  } catch {
    return {
      success: false,
      message: "Network error. Please try again.",
    };
  }
}

export async function logoutAction(): Promise<AuthActionResult> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      cache: "no-store",
    }).catch(() => null);

    const cookieStore = await cookies();
    cookieStore.delete("token");

    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch {
    return {
      success: false,
      message: "Failed to logout",
    };
  }
}
