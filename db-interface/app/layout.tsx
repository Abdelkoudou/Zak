import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DB Interface - Admin Panel",
  description: "Database management interface for MCQ Study App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
