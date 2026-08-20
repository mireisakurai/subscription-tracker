"use client";

import { useMemo, useState } from "react";
import { daysUntil, formatDate, formatMoney, monthlyCost, periodCost, toBase } from "@/lib/currency";
import { BILLING_CYCLES, type Member, type Subscription } from "@/lib/types";

const CYCLE_LABEL = Object.fromEntries(BILLING_CYCLES.map((c) => [c.value, c.label]));

type SortKey = "name" | "monthly" | "renewal";

function ownerLabel(email: string | null, members: Member[]) {
  if (!email) return "Unassigned";
  return members.find((m) => m.email === email)?.display_name || email;
}

/**
 * Defined at module scope rather than inside the table: a component declared in
 * a render body is a new type every render, so React remounts it and the header
 * button loses focus the moment you sort with the keyboard.
 */
function SortHeader({
  label,
  sortBy,
  sortKey,
  ascending,
  onSort,
  className = "",
}: {
  label: string;
  sortBy: SortKey;
  sortKey: SortKey;
  ascending: boolean;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sortKey === sortBy;
  return (
    <th scope="col" className={`px-4 py-3 font-medium ${className}`} aria-sort={active ? (ascending ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(sortBy)}
        className={`inline-flex items-center gap-1 transition hover:text-ink ${active ? "text-ink" : ""}`}
      >
        {label}
        <span aria-hidden className={`text-[10px] ${active ? "opacity-100" : "opacity-0"}`}>
          {ascending ? "▲" : "▼"}
        </span>
      </button>
    </th>
  );
}

function RenewalCell({ iso }: { iso: string | null }) {
  const days = daysUntil(iso);
  if (days === null) return <span className="text-faint">—</span>;

  const tone = days < 0 ? "text-danger" : days <= 14 ? "text-warn" : "text-muted";
  const suffix =
    days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "today" : `in ${days}d`;

  return (
    <div>
      <div className="text-ink">{formatDate(iso)}</div>
      <div className={`text-xs ${tone}`}>{suffix}</div>
    </div>
  );
}

export default function SubscriptionTable({
  subscriptions,
  members,
  baseCurrency,
  rates,
  onEdit,
}: {
  subscriptions: Subscription[];
  members: Member[];
  baseCurrency: string;
  rates: Record<string, number>;
  onEdit: (sub: Subscription) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("monthly");
  const [ascending, setAscending] = useState(false);

  const sorted = useMemo(() => {
    const rows = [...subscriptions];
    rows.sort((a, b) => {
      let delta: number;
      if (sortKey === "name") {
        delta = a.name.localeCompare(b.name);
      } else if (sortKey === "renewal") {
        // Rows without a date sort last regardless of direction.
        if (!a.next_renewal && !b.next_renewal) delta = 0;
        else if (!a.next_renewal) return 1;
        else if (!b.next_renewal) return -1;
        else delta = a.next_renewal.localeCompare(b.next_renewal);
      } else {
        const am = toBase(monthlyCost(a), a.currency, rates) ?? -1;
        const bm = toBase(monthlyCost(b), b.currency, rates) ?? -1;
        delta = am - bm;
      }
      return ascending ? delta : -delta;
    });
    return rows;
  }, [subscriptions, sortKey, ascending, rates]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setAscending((v) => !v);
    else {
      setSortKey(key);
      setAscending(key === "name" || key === "renewal");
    }
  }

  if (subscriptions.length === 0) {
    return (
      <div className="card px-6 py-16 text-center">
        <p className="text-sm font-medium">Nothing here yet</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
          Add your first entry — a streaming plan, the broadband bill, insurance, a shared tool.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line bg-raised/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              <SortHeader label="Item" sortBy="name" sortKey={sortKey} ascending={ascending} onSort={toggleSort} />
              <th scope="col" className="px-4 py-3 font-medium">Paid by</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Charge</th>
              <th scope="col" className="px-4 py-3 font-medium">Cycle</th>
              <SortHeader
                label={`Monthly (${baseCurrency})`}
                sortBy="monthly"
                sortKey={sortKey}
                ascending={ascending}
                onSort={toggleSort}
                className="text-right"
              />
              <SortHeader label="Next renewal" sortBy="renewal" sortKey={sortKey} ascending={ascending} onSort={toggleSort} />
              <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.map((sub) => {
              const converted = toBase(monthlyCost(sub), sub.currency, rates);
              const showsSeats = sub.seats > 1;

              return (
                <tr
                  key={sub.id}
                  className={`transition hover:bg-raised/50 ${sub.is_active ? "" : "opacity-55"}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium text-ink">
                      {sub.name}
                      {!sub.is_active && (
                        <span className="rounded border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                          Paused
                        </span>
                      )}
                    </div>
                    {sub.category && <div className="mt-0.5 text-xs text-muted">{sub.category}</div>}
                  </td>

                  <td className="px-4 py-3 text-muted">{ownerLabel(sub.owner_email, members)}</td>

                  <td className="tnum px-4 py-3 text-right">
                    <div className="text-ink">{formatMoney(periodCost(sub), sub.currency)}</div>
                    {showsSeats && (
                      <div className="text-xs text-faint">
                        {sub.seats} × {formatMoney(Number(sub.amount), sub.currency)}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 text-muted">{CYCLE_LABEL[sub.billing_cycle] ?? sub.billing_cycle}</td>

                  <td className="tnum px-4 py-3 text-right">
                    {sub.billing_cycle === "one_off" ? (
                      <span className="text-faint">one-off</span>
                    ) : converted === null ? (
                      <span
                        className="cursor-help text-warn"
                        title={`No exchange rate available for ${sub.currency}.`}
                      >
                        no rate
                      </span>
                    ) : (
                      <span className="font-medium text-ink">{formatMoney(converted, baseCurrency)}</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <RenewalCell iso={sub.next_renewal} />
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onEdit(sub)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-muted transition hover:bg-raised hover:text-ink"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
