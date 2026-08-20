import type { BillingCycle, Subscription } from "./types";

/**
 * Currencies the ECB feed behind /api/rates publishes. Keeping the app's list
 * aligned with the feed means every currency you can pick is one we can also
 * convert — no silent "—" in the totals column.
 */
export const CURRENCIES = [
  "EUR", "USD", "GBP", "AUD", "CAD", "CHF", "JPY", "NZD", "SGD", "HKD",
  "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "RON", "BGN", "ISK", "TRY",
  "INR", "CNY", "KRW", "IDR", "MYR", "PHP", "THB", "ILS", "MXN", "BRL", "ZAR",
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number];

/**
 * Approximate EUR-based rates, used only when the live feed is unreachable so
 * the dashboard degrades to "roughly right" instead of blank. The UI flags any
 * total computed from these. Format: 1 EUR = N units.
 */
export const FALLBACK_RATES_EUR: Record<string, number> = {
  EUR: 1, USD: 1.09, GBP: 0.85, AUD: 1.65, CAD: 1.47, CHF: 0.94,
  JPY: 163, NZD: 1.79, SGD: 1.45, HKD: 8.5, SEK: 11.3, NOK: 11.7,
  DKK: 7.46, PLN: 4.28, CZK: 25.2, HUF: 395, RON: 4.97, BGN: 1.96,
  ISK: 150, TRY: 38, INR: 91, CNY: 7.85, KRW: 1500, IDR: 17500,
  MYR: 4.8, PHP: 62, THB: 37, ILS: 4.0, MXN: 20, BRL: 6.2, ZAR: 19.8,
};

/** How many billing periods fit in a month. One-offs are not recurring spend. */
const PERIODS_PER_MONTH: Record<BillingCycle, number> = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
  one_off: 0,
};

/** Charge for one billing period, in the subscription's own currency. */
export function periodCost(sub: Subscription): number {
  return Number(sub.amount) * Number(sub.seats || 1);
}

/** Normalised monthly cost, in the subscription's own currency. */
export function monthlyCost(sub: Subscription): number {
  return periodCost(sub) * PERIODS_PER_MONTH[sub.billing_cycle];
}

/**
 * Convert into the base currency the rates were fetched for.
 *
 * `rates` maps a currency code to "units of that currency per 1 base", which is
 * how the ECB quotes them — so we divide rather than multiply. Returns null for
 * a currency the feed doesn't cover, which callers surface instead of silently
 * treating as zero.
 */
export function toBase(amount: number, from: string, rates: Record<string, number>): number | null {
  const rate = rates[from];
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) return null;
  return amount / rate;
}

/**
 * Locale and time zone are pinned rather than left to the environment. With
 * `undefined`, the server formats with Node's locale and the browser with the
 * viewer's, so the two render different text for the same value and React
 * fails hydration (error #418).
 */
const LOCALE = "en-GB";

export function formatMoney(amount: number, currency: string, maximumFractionDigits = 2): string {
  try {
    return new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency,
      maximumFractionDigits,
      minimumFractionDigits: maximumFractionDigits === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    // Intl throws on codes it doesn't recognise; fall back to a plain number.
    return `${amount.toFixed(maximumFractionDigits)} ${currency}`;
  }
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/**
 * Whole days until a date; negative when it has already passed. Compared in UTC
 * on both sides — a local-midnight comparison puts the server and the browser
 * on different calendar days whenever their offsets straddle midnight.
 */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const target = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(target)) return null;
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - todayUtc) / 86_400_000);
}

export type Totals = {
  monthly: number;
  annual: number;
  /** Subscriptions whose currency the feed couldn't price. */
  unconvertible: Subscription[];
  byCategory: { key: string; monthly: number }[];
  byOwner: { key: string; monthly: number }[];
};

export function computeTotals(subs: Subscription[], rates: Record<string, number>): Totals {
  let monthly = 0;
  const unconvertible: Subscription[] = [];
  const categories = new Map<string, number>();
  const owners = new Map<string, number>();

  for (const sub of subs) {
    if (!sub.is_active) continue;
    const converted = toBase(monthlyCost(sub), sub.currency, rates);
    if (converted === null) {
      unconvertible.push(sub);
      continue;
    }
    monthly += converted;
    const category = sub.category?.trim() || "Uncategorised";
    const owner = sub.owner_email?.trim() || "Unassigned";
    categories.set(category, (categories.get(category) ?? 0) + converted);
    owners.set(owner, (owners.get(owner) ?? 0) + converted);
  }

  const descending = (a: { monthly: number }, b: { monthly: number }) => b.monthly - a.monthly;

  return {
    monthly,
    annual: monthly * 12,
    unconvertible,
    byCategory: [...categories].map(([key, m]) => ({ key, monthly: m })).sort(descending),
    byOwner: [...owners].map(([key, m]) => ({ key, monthly: m })).sort(descending),
  };
}
