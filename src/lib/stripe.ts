import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      httpClient: Stripe.createFetchHttpClient(),
    });
  }
  return _stripe;
}

export const CREDIT_PACKAGES = [
  { id: "10_credits", credits: 10, price: 299, label: "10 credits", popular: false },
  { id: "50_credits", credits: 50, price: 999, label: "50 credits", popular: true },
  { id: "150_credits", credits: 150, price: 1999, label: "150 credits", popular: false },
] as const;
