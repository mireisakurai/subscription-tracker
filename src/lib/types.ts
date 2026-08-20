export type BillingCycle = "weekly" | "monthly" | "quarterly" | "yearly" | "one_off";

export const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "weekly", label: "Weekly" },
  { value: "one_off", label: "One-off" },
];

export type Subscription = {
  id: string;
  name: string;
  category: string | null;
  amount: number;
  currency: string;
  billing_cycle: BillingCycle;
  seats: number;
  next_renewal: string | null;
  owner_email: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Member = {
  email: string;
  display_name: string | null;
};

export type RatesPayload = {
  base: string;
  date: string | null;
  rates: Record<string, number>;
  /** "live" straight from the ECB feed, "fallback" when the feed was unreachable. */
  source: "live" | "fallback";
};

/** Suggested categories — free text, these just populate the datalist. */
export const CATEGORY_SUGGESTIONS = [
  "Utilities",
  "Phone & Internet",
  "Streaming",
  "Insurance",
  "Health & Fitness",
  "Transport",
  "Travel",
  "Software",
  "Groceries & Delivery",
  "Home",
  "Finance",
  "Other",
];

/** Form values for the add/edit dialog. All strings — they come from inputs. */
export type SubscriptionInput = {
  id?: string;
  name: string;
  category: string;
  amount: string;
  currency: string;
  billing_cycle: string;
  seats: string;
  next_renewal: string;
  owner_email: string;
  notes: string;
  is_active: boolean;
};
