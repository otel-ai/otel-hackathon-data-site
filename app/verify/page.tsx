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
          and load the data, your numbers should match these exactly.
        </p>
      </div>

      <Group title="Dataset metadata">
        <Stat label="dataset_revision" value={cs.dataset_revision} />
        <Stat
          label="reservation_stay_status_sha256"
          value={cs.reservation_stay_status_sha256.slice(0, 16) + "…"}
          mono
        />
      </Group>

      <Group title="Row counts">
        <Stat label="total_reservations" value={cs.total_reservations} />
        <Stat label="total_stay_rows" value={cs.total_stay_rows} />
        <Stat label="rate_plan_lookup_rows" value={cs.rate_plan_lookup_rows} />
        <Stat
          label="market_macro_group_history_rows"
          value={cs.market_macro_group_history_rows}
        />
        <Stat label="cancelled_reservations" value={cs.cancelled_reservations} />
        <Stat label="provisional_row_count" value={cs.provisional_row_count} />
        <Stat
          label="property_date_mismatch_count"
          value={cs.property_date_mismatch_count}
        />
      </Group>

      <Group title="Posted OTB (current, Reserved, Posted, stay_date ≥ today)">
        <Stat label="posted_stay_rows" value={cs.posted_stay_rows} />
        <Stat label="posted_otb_room_nights" value={cs.posted_otb_room_nights} />
        <Stat
          label="posted_room_revenue_before_tax"
          value={money(cs.posted_room_revenue_before_tax)}
        />
        <Stat
          label="posted_total_revenue_before_tax"
          value={money(cs.posted_total_revenue_before_tax)}
        />
      </Group>

      <Group title="Same time last year (last_year, Reserved)">
        <Stat label="stly_room_nights" value={cs.stly_room_nights} />
        <Stat label="stly_total_revenue_before_tax" value={money(cs.stly_total_revenue_before_tax)} />
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

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4" data-stat={label}>
      <div className="font-mono text-xs text-slate-500">{label}</div>
      <div
        className={`mt-1 text-lg font-semibold tabular-nums text-slate-100 ${
          mono ? "font-mono text-sm" : ""
        }`}
        data-revision={label === "dataset_revision" ? value : undefined}
        data-fingerprint={label === "reservation_stay_status_sha256" ? value : undefined}
      >
        {value}
      </div>
    </div>
  );
}
