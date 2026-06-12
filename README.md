# Grand Harbour Hotel — Reservations Portal

A synthetic, **always-forward-looking** hotel reservations site for the Revenue
Manager Agent hackathon. Teams **scrape** this site (Playwright recommended),
load the data into their own database, and point their agent at it.

Companion brief: [otel-build-challenge](https://github.com/otel-ai/otel-build-challenge)

## Why it needs a browser

Every data table is rendered client-side via Next.js Server Actions — there is
no downloadable file and no clean public JSON endpoint. A plain `curl` / HTTP
GET sees an empty shell; the rows only appear after JavaScript runs. This makes
real browser automation (Playwright) the intended extraction path.

## Data model

Generated deterministically from **today's date** (`lib/generate.ts`):

- **Current book** (~150 reservations): arrivals from `today − 14d` to
  `today + 120d`, future-weighted, with realistic lead times, a recent-bookings
  pickup cluster, cancellations, and group blocks. All `create_datetime`s are
  `≤ today` (nothing booked "in the future").
- **Last year** (~100 reservations): the same window shifted back 365 days,
  realized actuals, for same-time-last-year comparisons.

Each reservation expands into **one stay row per night**. The site is
master-detail:

- `/reservations` — paginated list (summary fields), 25 per page.
- `/reservations/[id]` — full fields **plus the per-night stay rows** and fields
  hidden from the list (`company_name`, `travel_agent_name`, revenue,
  `financial_status`, `property_date`, etc.).
- `/reference` — lookup tables (room types, markets, channels, **rate plans**,
  **macro group history**).
- `/verify` — **live checksums** for today's data (row counts, posted OTB,
  `dataset_revision`, pair hash). Self-check your load against these.
- `/changelog` — dataset field notes (footer link only).

The dataset is identical all day and regenerated each day, so checksums on
`/verify` always match what's currently rendered. Scrape and run your agent on
the same day.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Deploy

Push to GitHub and import the repo into Vercel. No environment variables are
required. It must run as a serverless (not static) deployment because the data
is generated per request — the default Vercel Next.js preset handles this.

Live site: [otel-hackathon-data-site.vercel.app](https://otel-hackathon-data-site.vercel.app)
