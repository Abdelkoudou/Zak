"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Check if we are on the buy page or any of its subpages
  const isBuyPage = pathname?.startsWith("/buy");

  if (isBuyPage) {
    // For buy pages, we render just the children (the page content)
    // We can wrap it in a div if specific background is needed, but the page/layout usually handles that.
    // However, the root layout has specific styles, so we might want to reset or apply specific styles here
    // to match the original buy layout intention (bg-gray-50).
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
