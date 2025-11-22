import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import SessionManager from "@/components/SessionManager";

export const metadata: Metadata = {
  title: "DB Interface - Admin Panel",
  description: "Database management interface for MCQ Study App",
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
    <html lang="fr">
      <body className="bg-gray-50">
        <SessionManager />
        <div className="flex flex-col md:flex-row min-h-screen">
          <Sidebar />
          <main className="flex-1 p-4 md:p-8 w-full overflow-x-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
