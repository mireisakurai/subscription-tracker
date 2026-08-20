"use client";

import { formatDate, formatMoney, type Totals } from "@/lib/currency";
import type { Subscription } from "@/lib/types";

function Card({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "accent" | "warn";
}) {
  const valueTone =
    tone === "accent" ? "text-accent" : tone === "warn" ? "text-warn" : "text-ink";

  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`tnum mt-2 text-2xl font-semibold tracking-tight ${valueTone}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  );
}

export default function SummaryCards({
  totals,
  baseCurrency,
  activeSubs,
}: {
  totals: Totals;
  baseCurrency: string;
  activeSubs: Subscription[];
}) {
  const upcoming = activeSubs
    .filter((s) => s.next_renewal)
    .sort((a, b) => (a.next_renewal! < b.next_renewal! ? -1 : 1))[0];

  const oneOffs = activeSubs.filter((s) => s.billing_cycle === "one_off").length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        label={`Monthly spend (${baseCurrency})`}
        value={formatMoney(totals.monthly, baseCurrency)}
        hint="Recurring only — one-offs excluded"
        tone="accent"
      />
      <Card
        label={`Annual run rate (${baseCurrency})`}
        value={formatMoney(totals.annual, baseCurrency, 0)}
        hint="Monthly × 12"
      />
      <Card
        label="Active subscriptions"
        value={String(activeSubs.length)}
        hint={oneOffs ? `${oneOffs} one-off charge${oneOffs === 1 ? "" : "s"}` : "All recurring"}
      />
      <Card
        label="Next renewal"
        value={upcoming ? formatDate(upcoming.next_renewal) : "—"}
        hint={upcoming ? upcoming.name : "No renewal dates set"}
      />
    </div>
  );
}
