'use client';

import { useState } from 'react';
import { updateSubscriptionPrice } from './actions';

interface PriceFormProps {
  initialPrice: string;
}

export default function PriceForm({ initialPrice }: PriceFormProps) {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setMessage(null);
    
    const result = await updateSubscriptionPrice(formData);
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Updated!' });
    }
    
    setIsLoading(false);
  }

  return (
    <form action={handleSubmit} className="space-y-4 max-w-md p-6 bg-white rounded-brand shadow-sm border border-gray-100">
      <div>
        <label htmlFor="price" className="block text-sm font-body font-medium text-brand-black mb-1">
          Subscription Price (DZD)
        </label>
        <div className="relative rounded-md shadow-sm">
          <input
            type="number"
            name="price"
            id="price"
            defaultValue={initialPrice}
            required
            min="0"
            className="block w-full rounded-brand border-gray-300 pl-3 pr-12 focus:border-brand-teal focus:ring-brand-teal sm:text-sm py-2 border font-body"
            placeholder="1000"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-500 sm:text-sm font-body">DZD</span>
          </div>
        </div>
        <p className="mt-1 text-xs font-body text-gray-500">
          This price will be used for all new 1-year subscriptions.
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-brand text-sm font-body ${message.type === 'success' ? 'bg-teal-50 text-brand-teal border border-teal-100' : 'bg-red-50 text-destructive border border-red-100'}`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-brand shadow-sm text-sm font-heading font-semibold text-white bg-brand-teal hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal disabled:opacity-50"
      >
        {isLoading ? 'Updating...' : 'Update Price'}
      </button>
    </form>
  );
}
