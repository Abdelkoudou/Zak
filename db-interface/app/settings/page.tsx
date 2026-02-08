import { supabaseAdmin, verifyOwner } from '@/lib/supabase-admin';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import PriceForm from './price-form';
import AnalyticsModeForm from './analytics-mode-form';

export const dynamic = 'force-dynamic';

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
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
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

  // Fetch current price
  const { data: configPrice } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'chargily_price_365')
    .single();

  const currentPrice = configPrice?.value || '1000';

  // Fetch analytics mode config
  const { data: analyticsMode } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'analytics_mode')
    .single();

  const { data: productionSalesPoints } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'production_sales_points')
    .single();

  // Fetch all sales points
  const { data: salesPoints } = await supabaseAdmin
    .from('sales_points')
    .select('id, name')
    .order('name');

  const currentMode = (analyticsMode?.value as 'dev' | 'production') || 'dev';
  const currentProductionSalesPoints: string[] = productionSalesPoints?.value 
    ? JSON.parse(productionSalesPoints.value) 
    : [];

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white min-h-screen">
      <h1 className="text-3xl font-heading font-bold text-brand-black mb-6">Paramètres</h1>
      
      {/* Analytics Mode Section */}
      <div className="bg-neutral-light shadow-sm rounded-brand p-6 border border-gray-100 mb-6">
        <h2 className="text-xl font-heading font-semibold text-brand-black mb-4 border-b border-gray-200 pb-2">
          🎯 Mode Analytique
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Basculez entre le mode Dev (toutes les données) et Production (données filtrées) pour vos analyses de revenus.
        </p>
        
        <AnalyticsModeForm
          initialMode={currentMode}
          initialProductionSalesPoints={currentProductionSalesPoints}
          salesPoints={salesPoints || []}
        />
      </div>

      {/* Subscription Settings Section */}
      <div className="bg-neutral-light shadow-sm rounded-brand p-6 border border-gray-100">
        <h2 className="text-xl font-heading font-semibold text-brand-black mb-4 border-b border-gray-200 pb-2">
          💳 Paramètres d&apos;abonnement
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-base font-body font-semibold text-brand-black mb-2">Prix de l&apos;abonnement annuel</h3>
            <p className="text-sm font-body text-gray-600 mb-4">
              Définir le prix de l&apos;abonnement de 365 jours. Ce changement s&apos;applique immédiatement aux nouveaux sessions de paiement.
            </p>
          </div>
          
          <PriceForm initialPrice={currentPrice} />
        </div>
      </div>
    </div>
  );
}
