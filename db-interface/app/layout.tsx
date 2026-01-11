import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppLayout from "@/components/AppLayout";
import SessionManager from "@/components/SessionManager";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "FMC APP - Admin Panel",
  description: "Interface d'administration pour FMC APP - Premium Medical Learning",
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
    <html lang="fr" suppressHydrationWarning>
      <body className="bg-theme-main text-theme-main">
        <ThemeProvider>
          <SessionManager />
          <AppLayout>
            {children}
          </AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
