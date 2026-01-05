import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Acheter FMC App - Abonnement Premium",
  description: "Accédez à plus de 10 000 QCM pour préparer vos examens de médecine",
};

export default function BuyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="bg-gray-50">
        <main>{children}</main>
      </body>
    </html>
  )
}
