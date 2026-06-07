// Derived verification targets — computed live from the same dataset the site
// renders. Teams scrape the site, load their own database, then check their
// numbers against /verify. Grader uses the same targets as ground truth.

import { Dataset, Reservation } from "./generate";

export interface Checksums {
  anchor_date: string;
  // Row counts
  total_reservations: number;
  total_stay_rows: number;
  current_reservations: number;
  last_year_reservations: number;
  cancelled_reservations: number;
  // On-the-books (current cohort, Reserved, stay_date >= anchor)
  otb_room_nights: number;
  otb_total_revenue_before_tax: number;
  otb_room_revenue_before_tax: number;
  // Same time last year (last_year cohort, Reserved)
  stly_room_nights: number;
  stly_total_revenue_before_tax: number;
  // ADR by room type (current cohort, Reserved) — reservation-level average
  adr_by_room_type: Record<string, number>;
  // Mix
  otb_room_nights_by_market: Record<string, number>;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeChecksums(ds: Dataset): Checksums {
  const anchor = ds.anchor_date;
  const reservations = ds.reservations;

  let totalStayRows = 0;
  let cancelled = 0;
  let currentCount = 0;
  let lastYearCount = 0;

  let otbRoomNights = 0;
  let otbTotalRev = 0;
  let otbRoomRev = 0;
  let stlyRoomNights = 0;
  let stlyTotalRev = 0;

  const adrSum: Record<string, number> = {};
  const adrCount: Record<string, number> = {};
  const marketNights: Record<string, number> = {};

  for (const r of reservations) {
    totalStayRows += r.stay_rows.length;
    if (r.reservation_status === "Cancelled") cancelled++;
    if (r.cohort === "current") currentCount++;
    else lastYearCount++;

    const isReserved = r.reservation_status === "Reserved";

    if (r.cohort === "current" && isReserved) {
      for (const s of r.stay_rows) {
        if (s.stay_date >= anchor) {
          otbRoomNights += r.number_of_spaces;
          otbTotalRev += s.daily_total_revenue_before_tax;
          otbRoomRev += s.daily_room_revenue_before_tax;
          marketNights[r.market_code] = (marketNights[r.market_code] ?? 0) + r.number_of_spaces;
        }
      }
      adrSum[r.space_type] = (adrSum[r.space_type] ?? 0) + r.adr_room;
      adrCount[r.space_type] = (adrCount[r.space_type] ?? 0) + 1;
    }

    if (r.cohort === "last_year" && isReserved) {
      for (const s of r.stay_rows) {
        stlyRoomNights += r.number_of_spaces;
        stlyTotalRev += s.daily_total_revenue_before_tax;
      }
    }
  }

  const adrByRoomType: Record<string, number> = {};
  for (const k of Object.keys(adrSum)) {
    adrByRoomType[k] = round2(adrSum[k] / adrCount[k]);
  }

  return {
    anchor_date: anchor,
    total_reservations: reservations.length,
    total_stay_rows: totalStayRows,
    current_reservations: currentCount,
    last_year_reservations: lastYearCount,
    cancelled_reservations: cancelled,
    otb_room_nights: otbRoomNights,
    otb_total_revenue_before_tax: round2(otbTotalRev),
    otb_room_revenue_before_tax: round2(otbRoomRev),
    stly_room_nights: stlyRoomNights,
    stly_total_revenue_before_tax: round2(stlyTotalRev),
    adr_by_room_type: adrByRoomType,
    otb_room_nights_by_market: marketNights,
  };
}

// Summary fields exposed in the reservations LIST (the rest live in detail).
export function toListItem(r: Reservation) {
  return {
    reservation_id: r.reservation_id,
    arrival_date: r.arrival_date,
    departure_date: r.departure_date,
    nights: r.nights,
    reservation_status: r.reservation_status,
    market_code: r.market_code,
    channel_code: r.channel_code,
    space_type: r.space_type,
    number_of_spaces: r.number_of_spaces,
    adr_room: r.adr_room,
    lead_time: r.lead_time,
  };
}
