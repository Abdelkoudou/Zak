import { supabaseAdmin, verifyOwner } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import AnalyticsModeForm from "./analytics-mode-form";
import SubscriptionPlansManager from "@/components/SubscriptionPlansManager";
import { getAllPlans } from "@/lib/subscription-plans";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const cookieStore = cookies();

  // Create a supabase client to get the current user session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify if user is owner
  const { isOwner } = await verifyOwner(user.id);

  if (!isOwner) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 border border-red-200 rounded m-4">
        <h1 className="text-xl font-bold">Unauthorized</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  // Fetch analytics mode config
  const { data: analyticsMode } = await supabaseAdmin
    .from("app_config")
    .select("value")
    .eq("key", "analytics_mode")
    .single();

  const { data: productionSalesPoints } = await supabaseAdmin
    .from("app_config")
    .select("value")
    .eq("key", "production_sales_points")
    .single();

  // Fetch all sales points
  const { data: salesPoints } = await supabaseAdmin
    .from("sales_points")
    .select("id, name")
    .order("name");

  const currentMode = (analyticsMode?.value as "dev" | "production") || "dev";

  let currentProductionSalesPoints: string[] = [];
  try {
    currentProductionSalesPoints = productionSalesPoints?.value
      ? JSON.parse(productionSalesPoints.value)
      : [];
  } catch (e) {
    console.error("Error parsing production_sales_points:", e);
    currentProductionSalesPoints = [];
  }

  // Fetch subscription plans
  let plans: Awaited<ReturnType<typeof getAllPlans>> = [];
  try {
    plans = await getAllPlans();
  } catch (e) {
    console.error("Error fetching subscription plans:", e);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white min-h-screen">
      <h1 className="text-3xl font-heading font-bold text-brand-black mb-6">
        Paramètres
      </h1>

      {/* Analytics Mode Section */}
      <div className="bg-neutral-light shadow-sm rounded-brand p-6 border border-gray-100 mb-6">
        <h2 className="text-xl font-heading font-semibold text-brand-black mb-4 border-b border-gray-200 pb-2">
          🎯 Mode Analytique
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Basculez entre le mode Dev (toutes les données) et Production (données
          filtrées) pour vos analyses de revenus.
        </p>

        <AnalyticsModeForm
          initialMode={currentMode}
          initialProductionSalesPoints={currentProductionSalesPoints}
          salesPoints={salesPoints || []}
        />
      </div>

      {/* Subscription Plans Section */}
      <div className="bg-neutral-light shadow-sm rounded-brand p-6 border border-gray-100">
        <h2 className="text-xl font-heading font-semibold text-brand-black mb-4 border-b border-gray-200 pb-2">
          💳 Gestion des Offres
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Créez, modifiez et gérez vos offres d&apos;abonnement. Les offres
          actives apparaissent sur la page d&apos;achat.
        </p>

        <SubscriptionPlansManager initialPlans={plans} />
      </div>
    </div>
  );
}
