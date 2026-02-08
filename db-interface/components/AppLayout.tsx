"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Check if we are on pages that should not show the sidebar
  const isPublicPage =
    pathname?.startsWith("/buy") ||
    pathname?.startsWith("/buy") ||
    // Only hide sidebar for public payment flow (success/failure pages), not the admin payments list
    pathname === "/payment" ||
    pathname?.startsWith("/payment/") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/delete-account");

  if (isPublicPage) {
    // For public pages (buy, payment, login, delete-account), render without sidebar
    return <div className="min-h-screen bg-theme-main">{children}</div>;
  }

  // For all other pages, render the Admin Sidebar layout
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
