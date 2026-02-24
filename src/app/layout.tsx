import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";
import { decodeJwt } from "jose";
import "@/src/globals.css";
import QueryProvider from "@/src/lib/queryprovider";
import { SidebarInset, SidebarProvider } from "../components/ui/sidebar";
import { AppSidebar } from "../shared/AppSidebar";
import { SiteHeader } from "../shared/SiteHeader";
import { Toaster } from "../components/ui/sonner";
import { ThemeProvider } from "../lib/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orkid Hills Hotel",
  description: "Hotel reservation",
};

const getUserRoleFromToken = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    const payload = decodeJwt(token) as { role?: string };
    return payload.role || null;
  } catch {
    return null;
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const heads = await headers();
  const pathname = heads.get("next-url") || "";

  if (pathname === "/login") {
    return (
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>{children}</QueryProvider>
            <Toaster position="top-center" richColors />
          </ThemeProvider>
        </body>
      </html>
    );
  }

  const userRole = await getUserRoleFromToken();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider
            style={
              {
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
              } as React.CSSProperties
            }
          >
            <AppSidebar userRole={userRole} />
            <SidebarInset>
              <SiteHeader />
              <main className="relative">
                <QueryProvider>{children}</QueryProvider>
                <Toaster position="top-center" richColors />
              </main>
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
