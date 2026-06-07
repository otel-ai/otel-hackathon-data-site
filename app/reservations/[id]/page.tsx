"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getReservation } from "@/app/actions";
import { Reservation } from "@/lib/generate";

export default function ReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [res, setRes] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getReservation(id).then((r) => {
      if (active) {
        setRes(r);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <p className="text-slate-500">Loading reservation {id}…</p>;
  }

  if (!res) {
    return (
      <div className="space-y-4">
        <p className="text-slate-300">Reservation {id} not found.</p>
        <Link href="/reservations" className="text-teal-400 hover:text-teal-300">
          ← Back to reservations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="reservation-detail">
      <div>
        <Link
          href="/reservations"
          className="text-sm text-teal-400 hover:text-teal-300"
        >
          ← Back to reservations
        </Link>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold text-slate-100">
          <span className="font-mono text-teal-300">{res.reservation_id}</span>
          <span
            className={`rounded px-2 py-0.5 text-xs ${
              res.reservation_status === "Cancelled"
                ? "bg-red-500/15 text-red-300"
                : "bg-emerald-500/15 text-emerald-300"
            }`}
          >
            {res.reservation_status}
          </span>
        </h1>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Reservation fields
        </h2>
        <dl
          className="grid grid-cols-1 gap-x-8 gap-y-3 rounded-lg border border-slate-800 bg-slate-900/40 p-6 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="reservation-fields"
        >
          <Field label="arrival_date" value={res.arrival_date} />
          <Field label="departure_date" value={res.departure_date} />
          <Field label="nights" value={res.nights} />
          <Field label="reservation_status" value={res.reservation_status} />
          <Field label="create_datetime" value={res.create_datetime} />
          <Field label="cancellation_datetime" value={res.cancellation_datetime ?? "—"} />
          <Field label="guest_country" value={res.guest_country} />
          <Field label="is_block" value={String(res.is_block)} />
          <Field label="is_walk_in" value={String(res.is_walk_in)} />
          <Field label="number_of_spaces" value={res.number_of_spaces} />
          <Field label="space_type" value={res.space_type} />
          <Field label="market_code" value={res.market_code} />
          <Field label="channel_code" value={res.channel_code} />
          <Field label="source_name" value={res.source_name} />
          <Field label="rate_plan_code" value={res.rate_plan_code} />
          <Field label="adr_room" value={res.adr_room.toFixed(2)} />
          <Field label="lead_time" value={res.lead_time} />
          <Field label="company_name" value={res.company_name ?? "—"} />
          <Field label="travel_agent_name" value={res.travel_agent_name ?? "—"} />
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Stay rows · one row per night ({res.stay_rows.length})
        </h2>
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full border-collapse text-sm" data-testid="stay-rows-table">
            <thead className="bg-slate-900/70 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">stay_date</th>
                <th className="px-4 py-3 text-right font-medium">
                  daily_room_revenue_before_tax
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  daily_total_revenue_before_tax
                </th>
              </tr>
            </thead>
            <tbody>
              {res.stay_rows.map((s) => (
                <tr
                  key={s.stay_date}
                  className="border-t border-slate-800"
                  data-stay-date={s.stay_date}
                >
                  <td className="px-4 py-2.5 text-slate-200">{s.stay_date}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-200">
                    {s.daily_room_revenue_before_tax.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-200">
                    {s.daily_total_revenue_before_tax.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div data-field={label}>
      <dt className="text-xs font-mono text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-200">{value}</dd>
    </div>
  );
}
