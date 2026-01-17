import { supabaseAdmin, verifyOwner } from '@/lib/supabase-admin';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import PriceForm from './price-form';

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

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Paramètres</h1>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Paramètres d'abonnement</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Prix de l'abonnement annuel</h3>
            <p className="text-sm text-gray-500 mb-4">
              Définir le prix de l'abonnement de 365 jours. Ce changement s'applique immédiatement aux nouveaux sessions de paiement.
            </p>
          </div>
          
          <PriceForm initialPrice={currentPrice} />
        </div>
      </div>
    </div>
  );
}
