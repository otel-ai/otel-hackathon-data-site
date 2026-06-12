// Deterministic, forward-looking hotel reservation dataset generator.
//
// Everything is derived from an anchor date ("today"). Given the same anchor
// the output is byte-for-byte identical, so the site is stable within a day,
// fresh each day, and always forward-looking. No external dependencies.
//
// Grain mirrors the hackathon Postgres dataset:
//   - a reservation expands into one stay row per night (arrival..departure)
//   - number_of_spaces = rooms attached to the reservation for that stay date
//
// Two cohorts are generated:
//   - CURRENT book: arrivals from today-14d .. today+120d (future-weighted),
//     realistic lead times, a deliberate last-7-days booking cluster, ~11%
//     cancellations, and group blocks. This is the live "on-the-books".
//   - LAST YEAR (STLY): the same calendar window shifted back 365 days,
//     realized actuals (almost no cancellations) for same-time-last-year
//     comparisons.

// ----------------------------------------------------------------------------
// Seeded PRNG (mulberry32) — deterministic given an integer seed.
// ----------------------------------------------------------------------------
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ----------------------------------------------------------------------------
// Date helpers (UTC-based, date-only arithmetic to stay deterministic).
// ----------------------------------------------------------------------------
const MS_PER_DAY = 86400000;

function toUTCDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function dayNumber(date: Date): number {
  return Math.floor(date.getTime() / MS_PER_DAY);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function isoDateTime(date: Date): string {
  return date.toISOString().replace(".000Z", "Z");
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ----------------------------------------------------------------------------
// Lookup tables (mirror seed.sql).
// ----------------------------------------------------------------------------
export const ROOM_TYPE_LOOKUP = [
  { space_type: "KS", room_class: "Standard", display_name: "Standard King", number_of_rooms: 52 },
  { space_type: "TB", room_class: "Standard", display_name: "Standard Twin", number_of_rooms: 20 },
  { space_type: "EX", room_class: "Executive", display_name: "Executive King", number_of_rooms: 26 },
];

export const MARKET_CODE_LOOKUP = [
  { market_code: "OTA", market_name: "Online Travel Agency", macro_group: "Retail", description: "Third-party online channels such as Booking.com and Expedia." },
  { market_code: "BAR", market_name: "Best Available Retail", macro_group: "Retail", description: "Direct flexible retail business." },
  { market_code: "PROM", market_name: "Promotional Retail", macro_group: "Retail", description: "Direct promotional and member-rate retail bookings." },
  { market_code: "FIT", market_name: "Free Independent Traveller", macro_group: "Leisure", description: "Independent leisure demand, often direct or contracted." },
  { market_code: "CSR", market_name: "Corporate Negotiated", macro_group: "Corporate", description: "Negotiated corporate transient business." },
  { market_code: "CNR", market_name: "Corporate Room Nights", macro_group: "Corporate", description: "Corporate transient business via agency or negotiated accounts." },
  { market_code: "CNI", market_name: "Conference / Incentive Group", macro_group: "MICE", description: "Group business tied to conferences or incentives." },
  { market_code: "CGR", market_name: "Corporate Group", macro_group: "MICE", description: "Corporate group blocks and meetings business." },
  { market_code: "EVEN", market_name: "Event Demand", macro_group: "MICE", description: "Demand associated with citywide or hotel-linked events." },
  { market_code: "SMERF", market_name: "SMERF Group", macro_group: "Leisure Group", description: "Social, military, educational, religious, fraternal groups." },
];

export const CHANNEL_CODE_LOOKUP = [
  { channel_code: "WEB", channel_name: "Web / OTA Web", channel_group: "Digital" },
  { channel_code: "REC", channel_name: "Direct Reservations / Brand Web", channel_group: "Direct" },
  { channel_code: "EMA", channel_name: "Email / Central Reservations", channel_group: "Offline" },
  { channel_code: "WAL", channel_name: "Walk-in", channel_group: "Offline" },
];

export const RATE_PLAN_LOOKUP = [
  { rate_plan_code: "BOOKBAR", plan_family: "Retail", is_commissionable: true },
  { rate_plan_code: "GROUPBB", plan_family: "Group", is_commissionable: false },
  { rate_plan_code: "DLY1", plan_family: "Retail", is_commissionable: false },
  { rate_plan_code: "FITBB", plan_family: "Retail", is_commissionable: true },
  { rate_plan_code: "CORP10BB", plan_family: "Corporate", is_commissionable: false },
  { rate_plan_code: "PROMO1", plan_family: "Retail", is_commissionable: true },
  { rate_plan_code: "ZEPHYR-CORP-25", plan_family: "Corporate", is_commissionable: false },
  { rate_plan_code: "WALKIN", plan_family: "Retail", is_commissionable: false },
];

/** Effective-dated macro groups — join on stay_date, not market_code_lookup alone. */
export const MARKET_MACRO_GROUP_HISTORY = [
  { market_code: "OTA", valid_from: "2020-01-01", valid_to: null, macro_group: "Retail" },
  { market_code: "BAR", valid_from: "2020-01-01", valid_to: null, macro_group: "Retail" },
  { market_code: "PROM", valid_from: "2020-01-01", valid_to: "2025-06-01", macro_group: "Retail" },
  { market_code: "PROM", valid_from: "2025-06-01", valid_to: null, macro_group: "Leisure Group" },
  { market_code: "FIT", valid_from: "2020-01-01", valid_to: null, macro_group: "Leisure" },
  { market_code: "CSR", valid_from: "2020-01-01", valid_to: null, macro_group: "Corporate" },
  { market_code: "CNR", valid_from: "2020-01-01", valid_to: null, macro_group: "Corporate" },
  { market_code: "CNI", valid_from: "2020-01-01", valid_to: null, macro_group: "MICE" },
  { market_code: "CGR", valid_from: "2020-01-01", valid_to: null, macro_group: "MICE" },
  { market_code: "EVEN", valid_from: "2020-01-01", valid_to: null, macro_group: "MICE" },
  { market_code: "SMERF", valid_from: "2020-01-01", valid_to: null, macro_group: "Leisure Group" },
];

export const DATASET_REVISION = "2026.06.12.2";

const COUNTRIES = ["US", "IE", "GB", "DE", "FR", "NL", "CA", "ES"];

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------
export interface StayRow {
  stay_date: string;
  property_date: string;
  financial_status: "Posted" | "Provisional";
  daily_room_revenue_before_tax: number;
  daily_total_revenue_before_tax: number;
}

export interface Reservation {
  reservation_id: string;
  cohort: "current" | "last_year";
  arrival_date: string;
  departure_date: string;
  nights: number;
  reservation_status: "Reserved" | "Cancelled";
  create_datetime: string;
  cancellation_datetime: string | null;
  guest_country: string;
  is_block: boolean;
  is_walk_in: boolean;
  number_of_spaces: number;
  space_type: string;
  market_code: string;
  channel_code: string;
  source_name: string;
  rate_plan_code: string;
  adr_room: number;
  lead_time: number;
  company_name: string | null;
  travel_agent_name: string | null;
  // Per-night expansion (the master-detail "detail").
  stay_rows: StayRow[];
}

export interface Dataset {
  anchor_date: string;
  generated_at: string;
  dataset_revision: string;
  reservations: Reservation[];
  room_type_lookup: typeof ROOM_TYPE_LOOKUP;
  rate_plan_lookup: typeof RATE_PLAN_LOOKUP;
  market_code_lookup: typeof MARKET_CODE_LOOKUP;
  market_macro_group_history: typeof MARKET_MACRO_GROUP_HISTORY;
  channel_code_lookup: typeof CHANNEL_CODE_LOOKUP;
}

// ----------------------------------------------------------------------------
// Reservation construction
// ----------------------------------------------------------------------------
function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function adrFor(rng: () => number, spaceType: string, marketCode: string, arrival: Date, anchor: Date): number {
  const base = spaceType === "EX" ? 245 : spaceType === "TB" ? 172 : 185;
  const marketAdj: Record<string, number> = {
    OTA: -18, BAR: 12, PROM: -10, FIT: 20, CSR: 8, CNR: 4,
    CNI: -22, CGR: -24, EVEN: -15, SMERF: -28,
  };
  // Seasonal lift: a peak window ~5-7 weeks out from the anchor.
  const leadFromAnchor = Math.round((arrival.getTime() - anchor.getTime()) / MS_PER_DAY);
  let seasonal = 0;
  if (leadFromAnchor >= 33 && leadFromAnchor <= 45) seasonal = 18;
  else if (leadFromAnchor >= 1 && leadFromAnchor <= 20) seasonal = -8;
  const noise = Math.floor(rng() * 7) * 3;
  return round2(base + (marketAdj[marketCode] ?? 0) + seasonal + noise);
}

function marketForBlock(rng: () => number): string {
  return pick(rng, ["CNI", "CGR", "EVEN", "SMERF"]);
}

function marketForTransient(rng: () => number): string {
  // Weighted toward OTA/retail, with corporate and leisure mixed in.
  const bag = [
    "OTA", "OTA", "OTA", "OTA",
    "BAR", "BAR", "PROM", "PROM",
    "FIT", "CSR", "CSR", "CNR",
  ];
  return pick(rng, bag);
}

function channelFor(rng: () => number, marketCode: string, isBlock: boolean, isWalkIn: boolean): string {
  if (isWalkIn) return "WAL";
  if (isBlock) return "EMA";
  if (marketCode === "OTA") return "WEB";
  if (["BAR", "PROM", "FIT"].includes(marketCode)) return rng() < 0.7 ? "REC" : "WEB";
  if (["CSR", "CNR"].includes(marketCode)) return rng() < 0.5 ? "EMA" : "REC";
  return "WEB";
}

function sourceName(rng: () => number, marketCode: string, channelCode: string): string {
  if (channelCode === "WAL") return "Walk-in";
  if (marketCode === "OTA") return rng() < 0.5 ? "Booking.com" : "Expedia";
  if (channelCode === "EMA") return "OCC Central Reservations";
  if (["BAR", "PROM", "FIT"].includes(marketCode) && rng() < 0.3) return "Members Rate booking";
  if (channelCode === "REC") return "Brand website";
  return "Sabre";
}

function ratePlan(rng: () => number, marketCode: string, channelCode: string): string {
  if (["CNI", "CGR", "EVEN", "SMERF"].includes(marketCode)) return "GROUPBB";
  if (marketCode === "CSR") return rng() < 0.5 ? "CORP10BB" : "BARCBB";
  if (marketCode === "CNR") return "GOORO";
  if (marketCode === "FIT") return "FITBB";
  if (marketCode === "PROM") return rng() < 0.5 ? "OCHEARLY" : "OCHPERKRO";
  if (marketCode === "BAR") return rng() < 0.5 ? "DLY1" : "DLYBB";
  if (marketCode === "OTA" && channelCode === "WEB" && rng() < 0.5) {
    return pick(rng, ["BOOKBAR", "BOOKBARB", "BOOKPROM"]);
  }
  if (marketCode === "OTA") return pick(rng, ["EXPP", "EXPBARB", "EXPBARH"]);
  return "DLY1";
}

const BLOCK_COMPANIES = ["TechSummit", "Legal Partners LLP", "Dublin Design Week", "Community Choir"];
const CORP_COMPANIES = ["Acme Consulting", "Vertex Systems", "DraftKings", "Barclays"];

interface CohortConfig {
  cohort: "current" | "last_year";
  count: number;
  windowStart: Date; // earliest arrival
  windowDays: number; // span of arrival window
  futureWeighted: boolean;
  cancelRate: number;
  anchor: Date; // reference "as of" date for this cohort
  idOffset: number;
}

function buildReservation(rng: () => number, n: number, cfg: CohortConfig): Reservation {
  const id = "R" + String(cfg.idOffset + n).padStart(4, "0");

  // ~11% of reservations are group blocks (multi-room, multi-night).
  const isBlock = rng() < 0.11;
  const isWalkIn = !isBlock && rng() < 0.04;

  // Arrival date — future-weighted for the current cohort.
  let frac = rng();
  if (cfg.futureWeighted) frac = Math.pow(frac, 0.7); // bias toward later (future) dates
  const arrivalOffset = Math.floor(frac * cfg.windowDays);
  const arrival = addDays(cfg.windowStart, arrivalOffset);

  // Stay length.
  let nights: number;
  if (isBlock) nights = 2 + Math.floor(rng() * 3); // 2-4 nights
  else nights = 1 + Math.floor(rng() * 3); // 1-3 nights
  const departure = addDays(arrival, nights);

  // Rooms.
  const numberOfSpaces = isBlock ? 4 + Math.floor(rng() * 9) : rng() < 0.05 ? 2 : 1;

  // Segment + channel.
  const marketCode = isBlock ? marketForBlock(rng) : marketForTransient(rng);
  const channelCode = channelFor(rng, marketCode, isBlock, isWalkIn);
  const spaceType = rng() < 0.09 ? "EX" : rng() < 0.27 ? "TB" : "KS";

  // Booking creation + lead time.
  //
  // A reservation only exists "on the books" as of the snapshot date, so its
  // create_datetime must be <= the cohort anchor. We therefore draw how long
  // ago the booking was made (booking age, in days) counting back from
  // min(arrival, anchor) — never the future — then derive lead time from it.
  const maxLead = cfg.futureWeighted ? 160 : 150;
  const cohortAnchor = cfg.anchor;
  const upperBound = arrival.getTime() < cohortAnchor.getTime() ? arrival : cohortAnchor;
  // Triangular-ish booking age (average of two uniforms) — most of the book was
  // built up weeks/months ago; recent bookings are a meaningful minority.
  let bookingAge = Math.floor(((rng() + rng()) / 2) * 150);
  // Deliberate cluster of very recent bookings (pickup / last-7-days signal).
  if (cfg.futureWeighted && rng() < 0.12) bookingAge = Math.floor(rng() * 7);
  let createDate = addDays(upperBound, -bookingAge);
  // Cap lead time so it never exceeds maxLead.
  const minCreate = addDays(arrival, -maxLead);
  if (createDate.getTime() < minCreate.getTime()) createDate = minCreate;
  const leadTime = Math.round((arrival.getTime() - createDate.getTime()) / MS_PER_DAY);
  const createHour = Math.floor(rng() * 24);
  const createMin = Math.floor(rng() * 60);
  const createDatetime = new Date(createDate.getTime() + (createHour * 3600 + createMin * 60) * 1000);

  // Cancellations. A cancelled booking must have been cancelled after it was
  // created and at/before the snapshot (a future cancellation hasn't happened
  // yet), and before arrival.
  const isCancelled = rng() < cfg.cancelRate;
  const status: "Reserved" | "Cancelled" = isCancelled ? "Cancelled" : "Reserved";
  let cancellationDatetime: string | null = null;
  if (isCancelled) {
    const cancelUpper = upperBound; // min(arrival, anchor)
    const span = Math.max(1, Math.round((cancelUpper.getTime() - createDate.getTime()) / MS_PER_DAY));
    const cancelOffset = Math.floor(rng() * span); // 0..span-1 days after create
    const cancelDate = addDays(createDate, cancelOffset);
    cancellationDatetime = isoDateTime(new Date(cancelDate.getTime() + 12 * 3600 * 1000));
  }

  const guestCountry = pick(rng, COUNTRIES);

  // Company / travel agent.
  let companyName: string | null = null;
  let travelAgentName: string | null = null;
  if (isBlock) {
    companyName = pick(rng, BLOCK_COMPANIES);
  } else if (["CSR", "CNR"].includes(marketCode)) {
    companyName = pick(rng, CORP_COMPANIES);
    if (rng() < 0.5) travelAgentName = "TravelHub";
  }

  const adrRoom = adrFor(rng, spaceType, marketCode, arrival, cfg.anchor);
  const sourceN = sourceName(rng, marketCode, channelCode);
  const ratePlanCode = ratePlan(rng, marketCode, channelCode);

  // Per-night expansion.
  const breakfast = ratePlanCode.includes("BB") || ["FIT", "CNI", "CGR", "EVEN", "SMERF"].includes(marketCode);
  const stayRows: StayRow[] = [];
  for (let i = 0; i < nights; i++) {
    const stayDate = addDays(arrival, i);
    const roomRev = round2(adrRoom * numberOfSpaces);
    const totalRev = round2(roomRev + (breakfast ? 18 * numberOfSpaces : 0));
    stayRows.push({
      stay_date: isoDate(stayDate),
      property_date: isoDate(stayDate),
      financial_status: "Posted",
      daily_room_revenue_before_tax: roomRev,
      daily_total_revenue_before_tax: totalRev,
    });
  }

  return {
    reservation_id: id,
    cohort: cfg.cohort,
    arrival_date: isoDate(arrival),
    departure_date: isoDate(departure),
    nights,
    reservation_status: status,
    create_datetime: isoDateTime(createDatetime),
    cancellation_datetime: cancellationDatetime,
    guest_country: guestCountry,
    is_block: isBlock,
    is_walk_in: isWalkIn,
    number_of_spaces: numberOfSpaces,
    space_type: spaceType,
    market_code: marketCode,
    channel_code: channelCode,
    source_name: sourceN,
    rate_plan_code: ratePlanCode,
    adr_room: adrRoom,
    lead_time: leadTime,
    company_name: companyName,
    travel_agent_name: travelAgentName,
    stay_rows: stayRows,
  };
}

function buildZephyrReservation(anchor: Date): Reservation {
  const arrival = new Date(Date.UTC(2025, 8, 14)); // 2025-09-14
  const nights = 3;
  const departure = addDays(arrival, nights);
  const createDatetime = new Date(Date.UTC(2025, 4, 2, 9, 15, 0));
  const stayRows: StayRow[] = [];
  for (let i = 0; i < nights; i++) {
    const stayDate = addDays(arrival, i);
    stayRows.push({
      stay_date: isoDate(stayDate),
      property_date: isoDate(stayDate),
      financial_status: "Posted",
      daily_room_revenue_before_tax: 420,
      daily_total_revenue_before_tax: 468,
    });
  }
  return {
    reservation_id: "RES-ZEPHYR-7F3A",
    cohort: "current",
    arrival_date: isoDate(arrival),
    departure_date: isoDate(departure),
    nights,
    reservation_status: "Reserved",
    create_datetime: isoDateTime(createDatetime),
    cancellation_datetime: null,
    guest_country: "GB",
    is_block: false,
    is_walk_in: false,
    number_of_spaces: 2,
    space_type: "KS",
    market_code: "CSR",
    channel_code: "REC",
    source_name: "OCC Central Reservations",
    rate_plan_code: "ZEPHYR-CORP-25",
    adr_room: 210,
    lead_time: 135,
    company_name: "Zephyr Dynamics Ltd",
    travel_agent_name: null,
    stay_rows: stayRows,
  };
}

function buildPropertyDateEdgeReservation(
  reservationId: string,
  stayDate: string,
  propertyDate: string,
): Reservation {
  const stay = new Date(stayDate + "T00:00:00Z");
  const departure = addDays(stay, 1);
  return {
    reservation_id: reservationId,
    cohort: "current",
    arrival_date: stayDate,
    departure_date: isoDate(departure),
    nights: 1,
    reservation_status: "Reserved",
    create_datetime: isoDateTime(addDays(stay, -30)),
    cancellation_datetime: null,
    guest_country: "IE",
    is_block: false,
    is_walk_in: false,
    number_of_spaces: 1,
    space_type: "KS",
    market_code: "BAR",
    channel_code: "REC",
    source_name: "Brand website",
    rate_plan_code: "DLY1",
    adr_room: 185,
    lead_time: 30,
    company_name: null,
    travel_agent_name: null,
    stay_rows: [
      {
        stay_date: stayDate,
        property_date: propertyDate,
        financial_status: "Posted",
        daily_room_revenue_before_tax: 185,
        daily_total_revenue_before_tax: 203,
      },
    ],
  };
}

function applyProvisionalRows(reservations: Reservation[], seedBase: number): void {
  const rng = mulberry32(seedBase * 99991);
  let marked = 0;
  for (const reservation of reservations) {
    if (reservation.reservation_id === "RES-ZEPHYR-7F3A") continue;
    if (reservation.reservation_status !== "Reserved") continue;
    if (reservation.cohort !== "current") continue;
    for (const row of reservation.stay_rows) {
      if (marked >= 5) return;
      if (rng() < 0.08) {
        row.financial_status = "Provisional";
        marked++;
      }
    }
  }
  // Guarantee exactly five provisional rows for stable verify targets.
  if (marked < 5) {
    for (const reservation of reservations) {
      if (marked >= 5) break;
      if (reservation.reservation_status !== "Reserved" || reservation.cohort !== "current") continue;
      for (const row of reservation.stay_rows) {
        if (marked >= 5) break;
        if (row.financial_status === "Posted") {
          row.financial_status = "Provisional";
          marked++;
        }
      }
    }
  }
}

// ----------------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------------
export function generateDataset(anchorInput?: Date): Dataset {
  const anchor = toUTCDate(anchorInput ?? new Date());
  const seedBase = dayNumber(anchor);

  const cohorts: CohortConfig[] = [
    {
      cohort: "current",
      count: 150,
      windowStart: addDays(anchor, -14),
      windowDays: 134, // -14 .. +120
      futureWeighted: true,
      cancelRate: 0.11,
      anchor,
      idOffset: 0,
    },
    {
      cohort: "last_year",
      count: 100,
      windowStart: addDays(anchor, -365 - 14),
      windowDays: 134,
      futureWeighted: false,
      cancelRate: 0.03, // realized actuals — very few cancellations remain
      anchor: addDays(anchor, -365),
      idOffset: 5000,
    },
  ];

  const reservations: Reservation[] = [];
  for (const cfg of cohorts) {
    for (let n = 1; n <= cfg.count; n++) {
      // Per-reservation seed: stable per day, per cohort, per index.
      const rng = mulberry32(seedBase * 100000 + cfg.idOffset + n);
      reservations.push(buildReservation(rng, n, cfg));
    }
  }

  applyProvisionalRows(reservations, seedBase);

  reservations.push(
    buildPropertyDateEdgeReservation("RES-EDGE-001", "2025-08-31", "2025-09-01"),
    buildPropertyDateEdgeReservation("RES-EDGE-002", "2025-09-30", "2025-10-01"),
    buildPropertyDateEdgeReservation("RES-EDGE-003", "2025-07-15", "2025-07-14"),
  );

  // Append last so pagination places Zephyr on the final list page.
  reservations.push(buildZephyrReservation(anchor));

  return {
    anchor_date: isoDate(anchor),
    generated_at: isoDateTime(toUTCDate(anchorInput ?? new Date())),
    dataset_revision: DATASET_REVISION,
    reservations,
    room_type_lookup: ROOM_TYPE_LOOKUP,
    rate_plan_lookup: RATE_PLAN_LOOKUP,
    market_code_lookup: MARKET_CODE_LOOKUP,
    market_macro_group_history: MARKET_MACRO_GROUP_HISTORY,
    channel_code_lookup: CHANNEL_CODE_LOOKUP,
  };
}
