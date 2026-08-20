import Dashboard from "@/components/Dashboard";
import { DEMO_MEMBERS, buildDemoSubscriptions } from "@/lib/demo-data";

/**
 * Rendered per request rather than at build time, so the relative renewal dates
 * ("renews in 9 days") stay accurate instead of drifting until everything looks
 * overdue.
 */
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <Dashboard
      initialSubscriptions={buildDemoSubscriptions()}
      members={DEMO_MEMBERS}
      initialBaseCurrency="EUR"
    />
  );
}
