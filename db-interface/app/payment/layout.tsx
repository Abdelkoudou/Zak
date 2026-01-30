import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paiement - FMC App",
  description: "Confirmation de paiement FMC App",
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No wrapper needed - AppLayout handles the layout
  // This layout only provides metadata
  return <>{children}</>;
}
