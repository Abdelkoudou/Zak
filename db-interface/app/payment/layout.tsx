import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Paiement - FMC App",
  description: "Confirmation de paiement FMC App",
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  )
}
