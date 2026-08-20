import { NextResponse } from "next/server";
import { CURRENCIES, FALLBACK_RATES_EUR } from "@/lib/currency";
import type { RatesPayload } from "@/lib/types";

/** Twelve hours — the ECB publishes once a working day. */
const TTL_SECONDS = 43_200;

/**
 * Frankfurter is a free, key-less wrapper over the ECB reference rates. It has
 * moved host once, so both are tried before falling back to the bundled table.
 */
const endpoints = (base: string) => [
  `https://api.frankfurter.dev/v1/latest?base=${base}`,
  `https://api.frankfurter.app/latest?base=${base}`,
];

function fallback(base: string): RatesPayload {
  const perEurBase = FALLBACK_RATES_EUR[base];
  const rates: Record<string, number> = {};

  if (perEurBase) {
    // Re-base the EUR table: units of X per 1 base = (X per EUR) / (base per EUR).
    for (const [code, perEur] of Object.entries(FALLBACK_RATES_EUR)) {
      rates[code] = perEur / perEurBase;
    }
  }
  rates[base] = 1;

  return { base, date: null, rates, source: "fallback" };
}

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("base")?.toUpperCase() ?? "EUR";
  const base = (CURRENCIES as readonly string[]).includes(requested) ? requested : "EUR";

  for (const url of endpoints(base)) {
    try {
      const res = await fetch(url, {
        next: { revalidate: TTL_SECONDS },
        headers: { accept: "application/json" },
      });
      if (!res.ok) continue;

      const json = (await res.json()) as { rates?: Record<string, number>; date?: string };
      if (!json.rates || typeof json.rates !== "object") continue;

      const payload: RatesPayload = {
        base,
        date: json.date ?? null,
        // The feed omits the base itself; converting from base to base is 1:1.
        rates: { ...json.rates, [base]: 1 },
        source: "live",
      };
      return NextResponse.json(payload, {
        headers: { "cache-control": `public, max-age=0, s-maxage=${TTL_SECONDS}` },
      });
    } catch {
      // Try the next endpoint, then the bundled table.
    }
  }

  return NextResponse.json(fallback(base), {
    // Don't let a failed lookup get cached for long.
    headers: { "cache-control": "public, max-age=0, s-maxage=300" },
  });
}
