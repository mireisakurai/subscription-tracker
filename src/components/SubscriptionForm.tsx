"use client";

import { useEffect, useState } from "react";
import { CURRENCIES } from "@/lib/currency";
import {
  BILLING_CYCLES,
  CATEGORY_SUGGESTIONS,
  type Member,
  type Subscription,
  type SubscriptionInput,
} from "@/lib/types";

function blankForm(defaultCurrency: string, defaultOwner: string): SubscriptionInput {
  return {
    name: "",
    category: "",
    amount: "",
    currency: defaultCurrency,
    billing_cycle: "monthly",
    seats: "1",
    next_renewal: "",
    owner_email: defaultOwner,
    notes: "",
    is_active: true,
  };
}

function toForm(sub: Subscription): SubscriptionInput {
  return {
    id: sub.id,
    name: sub.name,
    category: sub.category ?? "",
    amount: String(sub.amount),
    currency: sub.currency,
    billing_cycle: sub.billing_cycle,
    seats: String(sub.seats),
    next_renewal: sub.next_renewal ?? "",
    owner_email: sub.owner_email ?? "",
    notes: sub.notes ?? "",
    is_active: sub.is_active,
  };
}

export default function SubscriptionForm({
  editing,
  members,
  defaultCurrency,
  defaultOwner,
  onClose,
  onSave,
  onDelete,
}: {
  /** A subscription to edit, or null for a new one. */
  editing: Subscription | null;
  members: Member[];
  defaultCurrency: string;
  defaultOwner: string;
  onClose: () => void;
  /** Returns an error message, or null on success. */
  onSave: (input: SubscriptionInput) => string | null;
  onDelete: (id: string) => string | null;
}) {
  const [form, setForm] = useState<SubscriptionInput>(
    editing ? toForm(editing) : blankForm(defaultCurrency, defaultOwner),
  );
  const [error, setError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function set<K extends keyof SubscriptionInput>(key: K, value: SubscriptionInput[K]) {
    // The cast is needed because TS widens a computed key of generic type.
    setForm((prev) => ({ ...prev, [key]: value }) as SubscriptionInput);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const message = onSave(form);
    if (message) setError(message);
    else onClose();
  }

  function handleDelete() {
    if (!editing) return;
    const message = onDelete(editing.id);
    if (message) setError(message);
    else onClose();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:p-8">
      {/* Backdrop click closes; the panel stops propagation. */}
      <div className="flex min-h-full items-start justify-center" onMouseDown={onClose}>
        <form
          onSubmit={handleSubmit}
          onMouseDown={(e) => e.stopPropagation()}
          className="card w-full max-w-2xl shadow-2xl"
        >
          <header className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 className="text-base font-semibold">
              {editing ? `Edit ${editing.name}` : "Add an entry"}
            </h2>
            <button type="button" onClick={onClose} className="rounded-md p-1 text-muted hover:bg-raised hover:text-ink">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="f-name" className="label">Item</label>
              <input
                id="f-name"
                required
                autoFocus
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Broadband, Netflix, insurance…"
                className="field"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="f-category" className="label">Category</label>
              <input
                id="f-category"
                list="category-options"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="Optional"
                className="field"
              />
              <datalist id="category-options">
                {CATEGORY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="f-amount" className="label">Amount</label>
              <input
                id="f-amount"
                required
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="0.00"
                className="field tnum"
              />
              <p className="mt-1 text-xs text-faint">Per unit, per period</p>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="f-currency" className="label">Currency</label>
              <select
                id="f-currency"
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
                className="field"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="f-seats" className="label">Units</label>
              <input
                id="f-seats"
                type="number"
                min="1"
                step="1"
                value={form.seats}
                onChange={(e) => set("seats", e.target.value)}
                className="field tnum"
              />
              <p className="mt-1 text-xs text-faint">1 for a flat charge</p>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="f-cycle" className="label">Billing cycle</label>
              <select
                id="f-cycle"
                value={form.billing_cycle}
                onChange={(e) => set("billing_cycle", e.target.value)}
                className="field"
              >
                {BILLING_CYCLES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="f-renewal" className="label">Next renewal</label>
              <input
                id="f-renewal"
                type="date"
                value={form.next_renewal}
                onChange={(e) => set("next_renewal", e.target.value)}
                className="field"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="f-owner" className="label">Paid by</label>
              <select
                id="f-owner"
                value={form.owner_email}
                onChange={(e) => set("owner_email", e.target.value)}
                className="field"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.email} value={m.email}>
                    {m.display_name || m.email}
                  </option>
                ))}
                {/* Keep a previous payer selectable even if they were removed. */}
                {form.owner_email && !members.some((m) => m.email === form.owner_email) && (
                  <option value={form.owner_email}>{form.owner_email}</option>
                )}
              </select>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="f-notes" className="label">Notes</label>
              <textarea
                id="f-notes"
                rows={2}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Plan tier, who holds the account, cancellation terms…"
                className="field resize-y"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => set("is_active", e.target.checked)}
                  className="h-4 w-4 rounded border-line accent-accent"
                />
                <span>Active — count this in the totals</span>
              </label>
            </div>

            {error && (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger sm:col-span-6">
                {error}
              </p>
            )}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4">
            <div>
              {editing &&
                (confirmingDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted">Remove from the list?</span>
                    <button type="button" onClick={handleDelete} className="btn-danger">
                      Yes, delete
                    </button>
                    <button type="button" onClick={() => setConfirmingDelete(false)} className="btn-ghost">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmingDelete(true)} className="btn-danger">
                    Delete
                  </button>
                ))}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="btn-ghost">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editing ? "Save changes" : "Add subscription"}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
