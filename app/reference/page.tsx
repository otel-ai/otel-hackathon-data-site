"use client";

import { useEffect, useState } from "react";
import { getReference } from "@/app/actions";

type Ref = Awaited<ReturnType<typeof getReference>>;

const TABS = [
  "Room types",
  "Markets",
  "Channels",
  "Rate plans",
  "Macro history",
] as const;

type Tab = (typeof TABS)[number];

export default function ReferencePage() {
  const [ref, setRef] = useState<Ref | null>(null);
  const [tab, setTab] = useState<Tab>("Room types");

  useEffect(() => {
    let active = true;
    getReference().then((r) => active && setRef(r));
    return () => {
      active = false;
    };
  }, []);

  if (!ref) return <p className="text-slate-500">Loading reference tables…</p>;

  return (
    <div className="space-y-8" data-testid="reference-page">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Reference tables</h1>
        <p className="mt-1 text-sm text-slate-400">
          Dataset revision{" "}
          <span className="font-mono text-teal-300">{ref.dataset_revision}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((label) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={tab === label}
            onClick={() => setTab(label)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === label
                ? "bg-teal-500/20 text-teal-200"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "Room types" && (
        <LookupTable
          title="room_type_lookup"
          testid="room-type-lookup"
          columns={["space_type", "room_class", "display_name", "number_of_rooms"]}
          rows={ref.room_type_lookup}
        />
      )}
      {tab === "Markets" && (
        <LookupTable
          title="market_code_lookup"
          testid="market-code-lookup"
          columns={["market_code", "market_name", "macro_group", "description"]}
          rows={ref.market_code_lookup}
        />
      )}
      {tab === "Channels" && (
        <LookupTable
          title="channel_code_lookup"
          testid="channel-code-lookup"
          columns={["channel_code", "channel_name", "channel_group"]}
          rows={ref.channel_code_lookup}
        />
      )}
      {tab === "Rate plans" && (
        <LookupTable
          title="rate_plan_lookup"
          testid="rate-plan-lookup"
          columns={["rate_plan_code", "plan_family", "is_commissionable"]}
          rows={ref.rate_plan_lookup.map((row) => ({
            ...row,
            is_commissionable: String(row.is_commissionable),
          }))}
        />
      )}
      {tab === "Macro history" && (
        <LookupTable
          title="market_macro_group_history"
          testid="market-macro-history"
          columns={["market_code", "valid_from", "valid_to", "macro_group"]}
          rows={ref.market_macro_group_history.map((row) => ({
            ...row,
            valid_to: row.valid_to ?? "—",
          }))}
        />
      )}
    </div>
  );
}

function LookupTable({
  title,
  testid,
  columns,
  rows,
}: {
  title: string;
  testid: string;
  columns: string[];
  rows: Record<string, string | number>[];
}) {
  return (
    <section>
      <h2 className="mb-3 font-mono text-sm text-teal-300">{title}</h2>
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full border-collapse text-sm" data-testid={testid}>
          <thead className="bg-slate-900/70 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              {columns.map((c) => (
                <th key={c} className="px-4 py-3 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-slate-800">
                {columns.map((c) => (
                  <td key={c} className="px-4 py-2.5 text-slate-200">
                    {row[c]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
