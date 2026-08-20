# Subscription Tracker

Shared recurring costs, in every currency they're actually billed in.

**[Live demo →](https://subscription-tracker-demo.vercel.app)** — no sign-up,
sample data, fully interactive.

Useful anywhere a few people split ongoing payments and nobody has the whole
picture: a household's bills and streaming plans, a shared flat, a group trip
with costs spread across countries, or a small team's tools.

Most trackers assume one currency. This one doesn't: each entry is stored in the
currency it's charged in, and totals roll up into whichever currency you pick,
using daily European Central Bank rates.

## What it does

- **Multi-currency.** 31 currencies. A USD streaming plan, a GBP utility bill
  and an AUD insurance policy all land in one comparable monthly number.
- **Normalised cycles.** Weekly, monthly, quarterly, yearly and one-off charges
  — plus per-unit pricing — reduce to a single monthly figure, so you can
  compare a £33/mo bill against a €720/yr one honestly.
- **Renewal warnings.** Overdue and due-within-14-days are flagged in the table.
- **Breakdowns** by category and by who's paying, so "why is that so expensive"
  has an answer.
- **CSV export**, search, and pause/resume without deleting history.

## The interesting bit: honest totals

Exchange rates come from the ECB via [Frankfurter](https://frankfurter.dev),
cached for 12 hours. If that feed is unreachable the app falls back to a bundled
approximate table **and says so in the UI** rather than quietly showing a
confidently wrong number. A currency the feed can't price is excluded from the
total and reported, instead of being silently treated as zero.

Rates are only ever applied to *totals*. Each entry always keeps its original
currency and amount — the number you were actually charged.

The money logic is deliberately concentrated in
[`src/lib/currency.ts`](src/lib/currency.ts). If a total ever looks wrong,
that's the one file to read.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · deployed on Vercel.

The demo holds its data in memory — no database, no accounts, nothing to leak.
Edits work exactly as they do with a backend attached; they just reset on
refresh.

## Running it

```bash
npm install && npm run dev
```

No environment variables, no services to configure.

## Adding a backend

The demo is deliberately storage-free. Making it multi-user needs three things,
none of which are in this repo:

- a database table behind `src/lib/demo-data.ts`
- sign-in, so entries can be attributed to a person
- an access rule, so only invited people can read the data

A reasonable version of this is Postgres with Row Level Security and
passwordless email sign-in, with every policy checking the signed-in address
against an allowlist table — so someone who signs up uninvited gets a valid
session and no data. Everything above the data layer — the currency maths, the
normalisation, the UI — is what you can already click through in the demo.
