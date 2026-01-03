import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Suppression de compte - FMC App",
  description: "Demande de suppression de compte FMC App",
};

export default function DeleteAccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="bg-gray-50">
        {/* Simple Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="text-xl font-bold text-gray-900">FMC App</span>
            </div>
          </div>
        </header>
        
        {/* Content - No sidebar */}
        <main>{children}</main>
      </body>
    </html>
  )
}
