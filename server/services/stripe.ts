import Stripe from "stripe";

class StripeService {
  private stripe: Stripe | null = null;

  constructor() {
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2025-04-30.basil' as any,
        });
        console.log('[Stripe] Stripe client initialized successfully');
      } catch (error) {
        console.error('[Stripe] Failed to initialize Stripe client:', error);
      }
    } else {
      console.warn("STRIPE_SECRET_KEY is not set. Subscription functionality may be limited.");
    }
  }

  /**
   * Check if Stripe integration is enabled and active
   */
  isStripeEnabled(): boolean {
    return this.stripe !== null;
  }

  /**
   * Retrieve a subscription by ID
   */
  async retrieveSubscription(subscriptionId: string) {
    if (!this.stripe) {
      throw new Error("Stripe service is not initialized (missing API key).");
    }
    return await this.stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Create a new checkout session (placeholder/extension helper)
   */
  async createCheckoutSession(params: Stripe.Checkout.SessionCreateParams) {
    if (!this.stripe) {
      throw new Error("Stripe service is not initialized (missing API key).");
    }
    return await this.stripe.checkout.sessions.create(params);
  }

  /**
   * Create a new billing portal session (placeholder/extension helper)
   */
  async createPortalSession(params: Stripe.BillingPortal.SessionCreateParams) {
    if (!this.stripe) {
      throw new Error("Stripe service is not initialized (missing API key).");
    }
    return await this.stripe.billingPortal.sessions.create(params);
  }

  /**
   * Construct event for webhook verification (placeholder/extension helper)
   */
  async constructEvent(payload: string | Buffer, header: string, secret: string) {
    if (!this.stripe) {
      throw new Error("Stripe service is not initialized (missing API key).");
    }
    return this.stripe.webhooks.constructEvent(payload, header, secret);
  }
}

export const stripeService = new StripeService();
