import { CURRENCIES } from "./currency";
import { BILLING_CYCLES, type BillingCycle, type Subscription, type SubscriptionInput } from "./types";

const VALID_CYCLES = new Set<string>(BILLING_CYCLES.map((c) => c.value));
const VALID_CURRENCIES = new Set<string>(CURRENCIES);

/**
 * Discriminated on `ok` and annotated explicitly. Left to infer, TypeScript
 * gives the success branch an implicit `error?: undefined`, which defeats
 * narrowing at the call site.
 */
export type Validated =
  | { ok: false; error: string }
  | { ok: true; row: Omit<Subscription, "id" | "created_at" | "updated_at"> };

export function validateSubscription(input: SubscriptionInput): Validated {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Name is required." };

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: "Amount must be a number of 0 or more." };
  }

  const seats = Number(input.seats || "1");
  if (!Number.isInteger(seats) || seats < 1) {
    return { ok: false, error: "Seats must be a whole number of 1 or more." };
  }

  const currency = input.currency.toUpperCase();
  if (!VALID_CURRENCIES.has(currency)) {
    return { ok: false, error: `Unsupported currency "${input.currency}".` };
  }

  if (!VALID_CYCLES.has(input.billing_cycle)) return { ok: false, error: "Pick a billing cycle." };

  return {
    ok: true,
    row: {
      name,
      category: input.category.trim() || null,
      amount,
      currency,
      billing_cycle: input.billing_cycle as BillingCycle,
      seats,
      next_renewal: input.next_renewal || null,
      owner_email: input.owner_email.trim() || null,
      notes: input.notes.trim() || null,
      is_active: input.is_active,
    },
  };
}
