"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listReservations, ListResult } from "@/app/actions";

export default function ReservationsPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listReservations(page, 25).then((res) => {
      if (active) {
        setData(res);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Reservations</h1>
          <p className="mt-1 text-sm text-slate-400">
            {data ? (
              <>
                {data.totalItems} reservations · book as of{" "}
                <span className="text-teal-300">{data.anchorDate}</span>
              </>
            ) : (
              "Loading the book of business…"
            )}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full border-collapse text-sm" data-testid="reservations-table">
          <thead className="bg-slate-900/70 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <Th>Reservation</Th>
              <Th>Arrival</Th>
              <Th>Departure</Th>
              <Th>Nights</Th>
              <Th>Status</Th>
              <Th>Market</Th>
              <Th>Channel</Th>
              <Th>Room</Th>
              <Th>Rooms</Th>
              <Th className="text-right">ADR</Th>
              <Th className="text-right">Lead</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading &&
              data?.items.map((r) => (
                <tr
                  key={r.reservation_id}
                  className="border-t border-slate-800 hover:bg-slate-900/50"
                  data-reservation-id={r.reservation_id}
                >
                  <Td>
                    <span className="font-mono text-teal-300">{r.reservation_id}</span>
                  </Td>
                  <Td>{r.arrival_date}</Td>
                  <Td>{r.departure_date}</Td>
                  <Td>{r.nights}</Td>
                  <Td>
                    <StatusBadge status={r.reservation_status} />
                  </Td>
                  <Td>{r.market_code}</Td>
                  <Td>{r.channel_code}</Td>
                  <Td>{r.space_type}</Td>
                  <Td>{r.number_of_spaces}</Td>
                  <Td className="text-right tabular-nums">{r.adr_room.toFixed(2)}</Td>
                  <Td className="text-right tabular-nums">{r.lead_time}</Td>
                  <Td>
                    <Link
                      href={`/reservations/${r.reservation_id}`}
                      className="text-xs font-medium text-teal-400 hover:text-teal-300"
                      data-testid={`detail-link-${r.reservation_id}`}
                    >
                      View →
                    </Link>
                  </Td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="flex items-center justify-between text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={data.page <= 1 || loading}
            className="rounded border border-slate-700 px-3 py-1.5 text-slate-300 enabled:hover:border-teal-500 disabled:opacity-40"
            data-testid="prev-page"
          >
            ← Prev
          </button>
          <span className="text-slate-400" data-testid="page-indicator">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={data.page >= data.totalPages || loading}
            className="rounded border border-slate-700 px-3 py-1.5 text-slate-300 enabled:hover:border-teal-500 disabled:opacity-40"
            data-testid="next-page"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>;
}

function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2.5 text-slate-200 ${className}`}>{children}</td>;
}

function StatusBadge({ status }: { status: string }) {
  const cancelled = status === "Cancelled";
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs ${
        cancelled ? "bg-red-500/15 text-red-300" : "bg-emerald-500/15 text-emerald-300"
      }`}
    >
      {status}
    </span>
  );
}
