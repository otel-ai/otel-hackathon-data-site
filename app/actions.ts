"use server";

import { generateDataset, Dataset, Reservation } from "@/lib/generate";
import { computeChecksums, Checksums, toListItem } from "@/lib/checksums";

// In-memory cache keyed by anchor date (YYYY-MM-DD). On serverless this lives
// for the lifetime of a warm instance; a cold start simply regenerates the
// identical dataset for the day.
let cache: { key: string; dataset: Dataset } | null = null;

function getDataset(): Dataset {
  const now = new Date();
  const key = now.toISOString().slice(0, 10);
  if (cache && cache.key === key) return cache.dataset;
  const dataset = generateDataset(now);
  cache = { key, dataset };
  return dataset;
}

export interface ListResult {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  anchorDate: string;
  items: ReturnType<typeof toListItem>[];
}

export async function listReservations(page: number, pageSize = 100): Promise<ListResult> {
  const ds = getDataset();
  const all = ds.reservations;
  const totalItems = all.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const items = all.slice(start, start + pageSize).map(toListItem);
  return {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    anchorDate: ds.anchor_date,
    items,
  };
}

export async function getReservation(id: string): Promise<Reservation | null> {
  const ds = getDataset();
  return ds.reservations.find((r) => r.reservation_id === id) ?? null;
}

export async function getReference() {
  const ds = getDataset();
  return {
    anchorDate: ds.anchor_date,
    room_type_lookup: ds.room_type_lookup,
    market_code_lookup: ds.market_code_lookup,
    channel_code_lookup: ds.channel_code_lookup,
  };
}

export async function getChecksums(): Promise<Checksums> {
  return computeChecksums(getDataset());
}
