"use client";

import { useEffect, useState } from "react";
import { getChecksums } from "@/app/actions";
import { Checksums } from "@/lib/checksums";

export default function VerifyPage() {
  const [cs, setCs] = useState<Checksums | null>(null);

  useEffect(() => {
    let active = true;
    getChecksums().then((c) => active && setCs(c));
    return () => {
      active = false;
    };
  }, []);

  if (!cs) return <p className="text-slate-500">Computing today&apos;s checksums…</p>;

  return (
    <div className="space-y-8" data-testid="verify">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Verification targets</h1>
        <p className="mt-1 text-sm text-slate-400">
          Live checksums for the dataset as of{" "}
          <span className="text-teal-300">{cs.anchor_date}</span>. After you scrape
          and load the data, your numbers should match these exactly. If they do
          not, your scrape is incomplete or your business logic is off.
        </p>
      </div>

      <Group title="Row counts">
        <Stat label="total_reservations" value={cs.total_reservations} />
        <Stat label="total_stay_rows" value={cs.total_stay_rows} />
        <Stat label="current_reservations" value={cs.current_reservations} />
        <Stat label="last_year_reservations" value={cs.last_year_reservations} />
        <Stat label="cancelled_reservations" value={cs.cancelled_reservations} />
      </Group>

      <Group title="On the books (current, Reserved, stay_date ≥ today)">
        <Stat label="otb_room_nights" value={cs.otb_room_nights} />
        <Stat label="otb_room_revenue_before_tax" value={money(cs.otb_room_revenue_before_tax)} />
        <Stat label="otb_total_revenue_before_tax" value={money(cs.otb_total_revenue_before_tax)} />
      </Group>

      <Group title="Same time last year (last_year, Reserved)">
        <Stat label="stly_room_nights" value={cs.stly_room_nights} />
        <Stat label="stly_total_revenue_before_tax" value={money(cs.stly_total_revenue_before_tax)} />
      </Group>

      <Group title="ADR by room type (current, Reserved)">
        {Object.entries(cs.adr_by_room_type).map(([k, v]) => (
          <Stat key={k} label={k} value={money(v)} />
        ))}
      </Group>

      <Group title="On-the-books room nights by market code">
        {Object.entries(cs.otb_room_nights_by_market)
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => (
            <Stat key={k} label={k} value={v} />
          ))}
      </Group>

      <details className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <summary className="cursor-pointer text-sm text-slate-300">
          Raw JSON
        </summary>
        <pre
          className="mt-3 overflow-x-auto text-xs text-slate-400"
          data-testid="checksums-json"
        >
          {JSON.stringify(cs, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function money(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4" data-stat={label}>
      <div className="font-mono text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-slate-100">{value}</div>
    </div>
  );
}
