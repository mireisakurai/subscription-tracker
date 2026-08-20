import type { Member, Subscription } from "./types";

/**
 * Fictional people. Deliberately a non-routable example domain — nothing here
 * should resemble a real person's address.
 */
export const DEMO_MEMBERS: Member[] = [
  { email: "alex@northwind.example", display_name: "Alex Chen" },
  { email: "sam@northwind.example", display_name: "Sam Okafor" },
];

/** `next_renewal` is omitted because the seeds carry an offset instead of a date. */
type Seed = Omit<Subscription, "id" | "created_at" | "updated_at" | "next_renewal"> & {
  renewalInDays: number | null;
};

/**
 * Two people splitting the running costs of a shared household, with a trip
 * being planned on the side. The spread of currencies is the point — it's what
 * makes the rollup in the summary cards worth looking at, and everyday costs
 * span currencies more readily than people expect once travel is involved.
 */
const SEEDS: Seed[] = [
  // Household bills — the bulk of it, and the reason the total is worth knowing.
  { name: "Council tax", category: "Utilities", amount: 168, currency: "GBP", billing_cycle: "monthly", seats: 1, owner_email: "sam@northwind.example", notes: "Band C, 10 instalments", is_active: true, renewalInDays: 11 },
  { name: "Energy", category: "Utilities", amount: 118.5, currency: "GBP", billing_cycle: "monthly", seats: 1, owner_email: "alex@northwind.example", notes: "Fixed tariff until spring", is_active: true, renewalInDays: 3 },
  { name: "Water", category: "Utilities", amount: 34, currency: "GBP", billing_cycle: "monthly", seats: 1, owner_email: "sam@northwind.example", notes: null, is_active: true, renewalInDays: 17 },
  { name: "Broadband", category: "Phone & Internet", amount: 32, currency: "GBP", billing_cycle: "monthly", seats: 1, owner_email: "alex@northwind.example", notes: "Out of contract — worth re-quoting", is_active: true, renewalInDays: 6 },
  { name: "Mobile", category: "Phone & Internet", amount: 15, currency: "GBP", billing_cycle: "monthly", seats: 2, owner_email: "alex@northwind.example", notes: "Two SIMs on one account", is_active: true, renewalInDays: 22 },

  // Insurance and memberships — the annual ones that quietly renew.
  { name: "Home insurance", category: "Insurance", amount: 289, currency: "GBP", billing_cycle: "yearly", seats: 1, owner_email: "sam@northwind.example", notes: "Contents only", is_active: true, renewalInDays: 74 },
  { name: "Travel insurance", category: "Insurance", amount: 156, currency: "AUD", billing_cycle: "yearly", seats: 2, owner_email: "alex@northwind.example", notes: "Bought while in Sydney, still billed in AUD", is_active: true, renewalInDays: -4 },
  { name: "Gym", category: "Health & Fitness", amount: 42, currency: "GBP", billing_cycle: "monthly", seats: 2, owner_email: "sam@northwind.example", notes: null, is_active: true, renewalInDays: 9 },

  // Streaming and everyday subscriptions.
  { name: "Netflix", category: "Streaming", amount: 12.99, currency: "GBP", billing_cycle: "monthly", seats: 1, owner_email: "sam@northwind.example", notes: "Standard, shared", is_active: true, renewalInDays: 14 },
  { name: "Spotify Duo", category: "Streaming", amount: 17.99, currency: "GBP", billing_cycle: "monthly", seats: 1, owner_email: "alex@northwind.example", notes: null, is_active: true, renewalInDays: 26 },
  { name: "Amazon Prime", category: "Streaming", amount: 95, currency: "GBP", billing_cycle: "yearly", seats: 1, owner_email: "alex@northwind.example", notes: null, is_active: true, renewalInDays: 121 },
  { name: "iCloud storage", category: "Software", amount: 8.99, currency: "GBP", billing_cycle: "monthly", seats: 1, owner_email: "sam@northwind.example", notes: "2 TB, shared family plan", is_active: true, renewalInDays: 19 },
  { name: "Dropbox Plus", category: "Software", amount: 11.99, currency: "USD", billing_cycle: "monthly", seats: 1, owner_email: "alex@northwind.example", notes: "Billed in USD", is_active: true, renewalInDays: 2 },
  { name: "1Password Families", category: "Software", amount: 59.88, currency: "USD", billing_cycle: "yearly", seats: 1, owner_email: "alex@northwind.example", notes: null, is_active: true, renewalInDays: 58 },

  // The trip — one-offs sit outside the recurring totals but still need tracking.
  { name: "Interrail passes", category: "Travel", amount: 265, currency: "EUR", billing_cycle: "one_off", seats: 2, owner_email: "sam@northwind.example", notes: "Global pass, 7 days in a month", is_active: true, renewalInDays: 41 },
  { name: "Apartment deposit, Lisbon", category: "Travel", amount: 320, currency: "EUR", billing_cycle: "one_off", seats: 1, owner_email: "alex@northwind.example", notes: "Refundable after the stay", is_active: true, renewalInDays: 47 },

  // Paused — kept for the history rather than deleted.
  { name: "Disney+", category: "Streaming", amount: 8.99, currency: "GBP", billing_cycle: "monthly", seats: 1, owner_email: "sam@northwind.example", notes: "Cancelled after the series finished", is_active: false, renewalInDays: null },
  { name: "Recipe box", category: "Groceries & Delivery", amount: 44.9, currency: "EUR", billing_cycle: "weekly", seats: 1, owner_email: "alex@northwind.example", notes: "Paused over the summer", is_active: false, renewalInDays: null },
];

function isoDate(base: Date, offsetDays: number): string {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Built on the server and passed down as props, so the dates are computed once.
 * Generating them in the browser instead would risk a hydration mismatch on the
 * relative "renews in N days" labels.
 */
export function buildDemoSubscriptions(now = new Date()): Subscription[] {
  const createdAt = new Date(now);
  createdAt.setUTCDate(createdAt.getUTCDate() - 45);
  const timestamp = createdAt.toISOString();

  return SEEDS.map(({ renewalInDays, ...row }, i) => ({
    ...row,
    id: `demo-${String(i + 1).padStart(2, "0")}`,
    next_renewal: renewalInDays === null ? null : isoDate(now, renewalInDays),
    created_at: timestamp,
    updated_at: timestamp,
  }));
}
