import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/src/globals.css";
import QueryProvider from "@/src/lib/queryprovider";
import { SidebarInset, SidebarProvider } from "../components/ui/sidebar";
import { AppSidebar } from "../shared/AppSidebar";
import { SiteHeader } from "../shared/SiteHeader";
import { Toaster } from "../components/ui/sonner";
import { ThemeProvider } from "../lib/theme-provider";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eco Hotel",
  description: "Hotel reservation",
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
            <AppSidebar />
            <SidebarInset>
              <SiteHeader />
              <main className="relative">
                <QueryProvider>{children}</QueryProvider>
                {/* <RouteLoader /> */}
                <Toaster position="top-center" richColors />
              </main>
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
