"use client";

import { useEffect, useState } from "react";
import { getReference } from "@/app/actions";

type Ref = Awaited<ReturnType<typeof getReference>>;

export default function ReferencePage() {
  const [ref, setRef] = useState<Ref | null>(null);

  useEffect(() => {
    let active = true;
    getReference().then((r) => active && setRef(r));
    return () => {
      active = false;
    };
  }, []);

  if (!ref) return <p className="text-slate-500">Loading reference tables…</p>;

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-slate-100">Reference tables</h1>

      <LookupTable
        title="room_type_lookup"
        testid="room-type-lookup"
        columns={["space_type", "room_class", "display_name", "number_of_rooms"]}
        rows={ref.room_type_lookup}
      />
      <LookupTable
        title="market_code_lookup"
        testid="market-code-lookup"
        columns={["market_code", "market_name", "macro_group", "description"]}
        rows={ref.market_code_lookup}
      />
      <LookupTable
        title="channel_code_lookup"
        testid="channel-code-lookup"
        columns={["channel_code", "channel_name", "channel_group"]}
        rows={ref.channel_code_lookup}
      />
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
