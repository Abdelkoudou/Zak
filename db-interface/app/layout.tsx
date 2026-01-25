import type { Metadata, Viewport } from "next";
import { Manrope, Cairo } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/AppLayout";
import SessionManager from "@/components/SessionManager";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/react";

const fontHeading = Manrope({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800"],
});

const fontBody = Cairo({
  subsets: ["latin", "arabic"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FMC APP - Admin Panel",
  description:
    "Interface d'administration pour FMC APP - Premium Medical Learning",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${fontHeading.variable} ${fontBody.variable}`}
    >
      <body className="bg-theme-main text-theme-main font-body">
        <ThemeProvider>
          <SessionManager />
          <AppLayout>{children}</AppLayout>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
