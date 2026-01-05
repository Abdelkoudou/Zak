/**
 * Chargily Pay API Client
 * 
 * Handles all interactions with the Chargily Pay V2 API for online payments.
 * Documentation: https://dev.chargily.com/pay-v2/
 */

// ============================================================================
// Types
// ============================================================================

export interface ChargilyConfig {
  secretKey: string;
  mode: 'test' | 'live';
}

export interface CreateCheckoutParams {
  amount: number;           // Amount in smallest unit (centimes for DZD)
  currency: 'dzd' | 'usd' | 'eur';
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  successUrl: string;
  failureUrl: string;
  webhookEndpoint: string;
  description?: string;
  locale?: 'ar' | 'en' | 'fr';
  metadata?: Record<string, string>;
}

export interface ChargilyCheckout {
  id: string;
  entity: 'checkout';
  livemode: boolean;
  amount: number;
  currency: string;
  fees: number;
  status: 'pending' | 'paid' | 'failed' | 'canceled';
  locale: string;
  description: string | null;
  metadata: Record<string, string> | null;
  success_url: string;
  failure_url: string;
  webhook_endpoint: string | null;
  payment_method: string | null;
  invoice_id: string | null;
  customer_id: string | null;
  created_at: number;
  updated_at: number;
  checkout_url: string;
}

export interface ChargilyWebhookEvent {
  id: string;
  entity: 'event';
  livemode: string;
  type: 'checkout.paid' | 'checkout.failed' | 'checkout.canceled';
  data: ChargilyCheckout;
  created_at: number;
  updated_at: number;
}

export interface ChargilyCustomer {
  id: string;
  entity: 'customer';
  livemode: boolean;
  name: string;
  email: string | null;
  phone: string | null;
  address: {
    country: string;
    state: string;
    address: string;
  } | null;
  metadata: Record<string, string> | null;
  created_at: number;
  updated_at: number;
}

export interface ChargilyBalance {
  entity: 'balance';
  livemode: boolean;
  wallets: Array<{
    currency: string;
    balance: number;
    ready_for_payout: string;
    on_hold: number;
  }>;
}

// ============================================================================
// Chargily Client Class
// ============================================================================

export class ChargilyClient {
  private secretKey: string;
  private baseUrl: string;

  constructor(config: ChargilyConfig) {
    this.secretKey = config.secretKey;
    this.baseUrl = config.mode === 'live' 
      ? 'https://pay.chargily.net/api/v2'
      : 'https://pay.chargily.net/test/api/v2';
  }

  /**
   * Make an authenticated request to the Chargily API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || `Chargily API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Create a new checkout session
   */
  async createCheckout(params: CreateCheckoutParams): Promise<ChargilyCheckout> {
    return this.request<ChargilyCheckout>('/checkouts', {
      method: 'POST',
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        success_url: params.successUrl,
        failure_url: params.failureUrl,
        webhook_endpoint: params.webhookEndpoint,
        description: params.description,
        locale: params.locale || 'fr',
        metadata: {
          customer_email: params.customerEmail,
          customer_name: params.customerName || '',
          customer_phone: params.customerPhone || '',
          ...params.metadata,
        },
      }),
    });
  }

  /**
   * Retrieve a checkout by ID
   */
  async getCheckout(checkoutId: string): Promise<ChargilyCheckout> {
    return this.request<ChargilyCheckout>(`/checkouts/${checkoutId}`);
  }

  /**
   * List all checkouts
   */
  async listCheckouts(page = 1, perPage = 10): Promise<{
    data: ChargilyCheckout[];
    current_page: number;
    last_page: number;
    total: number;
  }> {
    return this.request(`/checkouts?page=${page}&per_page=${perPage}`);
  }

  /**
   * Create a customer
   */
  async createCustomer(params: {
    name: string;
    email?: string;
    phone?: string;
    address?: {
      country: string;
      state: string;
      address: string;
    };
  }): Promise<ChargilyCustomer> {
    return this.request<ChargilyCustomer>('/customers', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<ChargilyBalance> {
    return this.request<ChargilyBalance>('/balance');
  }
}

// ============================================================================
// Webhook Signature Verification
// ============================================================================

/**
 * Verify Chargily webhook signature
 * Note: Chargily uses a simple signature based on the secret key
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  // Chargily uses HMAC-SHA256 for webhook signatures
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  
  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return computedSignature === signature;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get Chargily client instance
 */
export function getChargilyClient(): ChargilyClient {
  const secretKey = process.env.CHARGILY_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('CHARGILY_SECRET_KEY environment variable is not set');
  }
  
  // Determine mode from key prefix
  const mode = secretKey.startsWith('test_') ? 'test' : 'live';
  
  return new ChargilyClient({ secretKey, mode });
}

/**
 * Format amount for display (convert from centimes)
 */
export function formatAmount(amountInCentimes: number, currency: string): string {
  const amount = amountInCentimes / 100;
  
  const formatter = new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
}

/**
 * Parse webhook event type
 */
export function parseWebhookEventType(type: string): {
  resource: string;
  action: string;
} {
  const [resource, action] = type.split('.');
  return { resource, action };
}

// ============================================================================
// Constants
// ============================================================================

export const CHARGILY_CURRENCIES = ['dzd', 'usd', 'eur'] as const;
export const CHARGILY_LOCALES = ['ar', 'en', 'fr'] as const;

export const SUBSCRIPTION_PRICES = {
  '365': { amount: 100000, label: '1 An - 1000 DA' },      // 1000 DZD for 1 year
} as const;

export type SubscriptionDuration = keyof typeof SUBSCRIPTION_PRICES;
