"use client";

import { useEffect, useMemo, useState } from "react";
import Breakdown from "./Breakdown";
import SubscriptionForm from "./SubscriptionForm";
import SubscriptionTable from "./SubscriptionTable";
import SummaryCards from "./SummaryCards";
import { CURRENCIES, computeTotals, monthlyCost, periodCost, toBase } from "@/lib/currency";
import { validateSubscription } from "@/lib/validate";
import type { Member, RatesPayload, Subscription, SubscriptionInput } from "@/lib/types";

const REPO_URL = "https://github.com/mireisakurai/subscription-tracker";

function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export default function Dashboard({
  initialSubscriptions,
  members,
  initialBaseCurrency,
}: {
  initialSubscriptions: Subscription[];
  members: Member[];
  initialBaseCurrency: string;
}) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [baseCurrency, setBaseCurrency] = useState(initialBaseCurrency);
  const [rates, setRates] = useState<RatesPayload | null>(null);
  const [search, setSearch] = useState("");
  const [showPaused, setShowPaused] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRates(null);

    fetch(`/api/rates?base=${encodeURIComponent(baseCurrency)}`)
      .then((res) => res.json())
      .then((data: RatesPayload) => {
        if (!cancelled) setRates(data);
      })
      .catch(() => {
        // Offline: at least let same-currency rows render correctly.
        if (!cancelled) {
          setRates({ base: baseCurrency, date: null, rates: { [baseCurrency]: 1 }, source: "fallback" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [baseCurrency]);

  const rateTable = useMemo(() => rates?.rates ?? { [baseCurrency]: 1 }, [rates, baseCurrency]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return subscriptions.filter((sub) => {
      if (!showPaused && !sub.is_active) return false;
      if (!needle) return true;
      return [sub.name, sub.category, sub.owner_email, sub.notes]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle));
    });
  }, [subscriptions, search, showPaused]);

  const totals = useMemo(() => computeTotals(filtered, rateTable), [filtered, rateTable]);
  const activeInView = useMemo(() => filtered.filter((s) => s.is_active), [filtered]);
  const isFiltered = search.trim().length > 0;

  /**
   * Demo persistence is in-memory only. Returns an error string, or null on
   * success — the same contract the server-action version used, so the form
   * component didn't need reworking.
   */
  function handleSave(input: SubscriptionInput): string | null {
    const parsed = validateSubscription(input);
    if (!parsed.ok) return parsed.error;

    const now = new Date().toISOString();
    setSubscriptions((prev) =>
      input.id
        ? prev.map((s) => (s.id === input.id ? { ...s, ...parsed.row, updated_at: now } : s))
        : [...prev, { ...parsed.row, id: crypto.randomUUID(), created_at: now, updated_at: now }],
    );
    return null;
  }

  function handleDelete(id: string): string | null {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    return null;
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function exportCsv() {
    const header = [
      "Name", "Category", "Amount", "Currency", "Seats", "Billing cycle",
      "Period charge", `Monthly (${baseCurrency})`, "Next renewal", "Paid by", "Active", "Notes",
    ];
    const rows = subscriptions.map((sub) => {
      const converted = toBase(monthlyCost(sub), sub.currency, rateTable);
      return [
        sub.name, sub.category, sub.amount, sub.currency, sub.seats, sub.billing_cycle,
        periodCost(sub).toFixed(2), converted === null ? "" : converted.toFixed(2),
        sub.next_renewal, sub.owner_email, sub.is_active ? "yes" : "no", sub.notes,
      ];
    });

    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
        <p className="text-sm">
          <span className="font-medium">Live demo.</span>{" "}
          <span className="text-muted">
            Sample data, no sign-in. Add, edit and delete anything — changes stay in your browser and
            reset on refresh.
          </span>
        </p>
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="btn-ghost shrink-0">
          Source on GitHub
        </a>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Subscription Tracker</h1>
          <p className="mt-1 text-sm text-muted">
            Shared recurring costs, in every currency they are billed in
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="base-currency">Base currency</label>
          <select
            id="base-currency"
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
            className="field w-auto py-1.5 text-sm"
            title="Currency all totals roll up into"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>Totals in {c}</option>
            ))}
          </select>

          <button type="button" onClick={exportCsv} className="btn-ghost">Export CSV</button>

          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="btn-primary"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Add
          </button>
        </div>
      </header>

      <div className="mt-6">
        <SummaryCards totals={totals} baseCurrency={baseCurrency} activeSubs={activeInView} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-faint">
        {rates === null ? (
          <span>Loading exchange rates…</span>
        ) : rates.source === "live" ? (
          <span>ECB rates{rates.date ? ` · ${rates.date}` : ""}</span>
        ) : (
          <span className="text-warn">
            Live rate feed unreachable — totals use bundled approximate rates.
          </span>
        )}
        {isFiltered && <span>Totals reflect the current search.</span>}
        {totals.unconvertible.length > 0 && (
          <span className="text-warn">
            {totals.unconvertible.length} subscription
            {totals.unconvertible.length === 1 ? "" : "s"} excluded — no rate for{" "}
            {[...new Set(totals.unconvertible.map((s) => s.currency))].join(", ")}.
          </span>
        )}
      </div>

      <div className="mt-6">
        <Breakdown
          byCategory={totals.byCategory}
          byOwner={totals.byOwner}
          total={totals.monthly}
          baseCurrency={baseCurrency}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools, categories, notes…"
          className="field w-full sm:max-w-xs"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={showPaused}
            onChange={(e) => setShowPaused(e.target.checked)}
            className="h-4 w-4 rounded border-line accent-accent"
          />
          Show paused
        </label>
      </div>

      <div className="mt-3">
        <SubscriptionTable
          subscriptions={filtered}
          members={members}
          baseCurrency={baseCurrency}
          rates={rateTable}
          onEdit={(sub) => {
            setEditing(sub);
            setFormOpen(true);
          }}
        />
      </div>

      {formOpen && (
        <SubscriptionForm
          editing={editing}
          members={members}
          defaultCurrency={baseCurrency}
          defaultOwner={members[0]?.email ?? ""}
          onClose={closeForm}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </main>
  );
}
