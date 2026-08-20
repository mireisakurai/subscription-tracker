"use client";

import { formatMoney } from "@/lib/currency";

function Panel({
  title,
  rows,
  total,
  baseCurrency,
  emptyLabel,
}: {
  title: string;
  rows: { key: string; monthly: number }[];
  total: number;
  baseCurrency: string;
  emptyLabel: string;
}) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold">{title}</h3>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-faint">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.slice(0, 8).map((row) => {
            const share = total > 0 ? (row.monthly / total) * 100 : 0;
            return (
              <li key={row.key}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate text-ink">{row.key}</span>
                  <span className="tnum shrink-0 text-muted">
                    {formatMoney(row.monthly, baseCurrency, 0)}
                    <span className="ml-2 text-xs text-faint">{share.toFixed(0)}%</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-raised">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(share, 1.5)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function Breakdown({
  byCategory,
  byOwner,
  total,
  baseCurrency,
}: {
  byCategory: { key: string; monthly: number }[];
  byOwner: { key: string; monthly: number }[];
  total: number;
  baseCurrency: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel
        title="Monthly spend by category"
        rows={byCategory}
        total={total}
        baseCurrency={baseCurrency}
        emptyLabel="Tag your subscriptions with a category to see this split."
      />
      <Panel
        title="Monthly spend by payer"
        rows={byOwner}
        total={total}
        baseCurrency={baseCurrency}
        emptyLabel="Set “Paid by” on your subscriptions to see who is carrying what."
      />
    </div>
  );
}
