import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          Reservations data portal
        </h1>
        <p className="max-w-3xl text-slate-300">
          This portal publishes the Grand Harbour Hotel&apos;s live book of
          business. Your task is to <strong className="text-teal-300">scrape it</strong>,
          load it into your own database, and point your Revenue Manager Agent at
          the result. There is no download button and no public API — the tables
          render in the browser, so you will need a real browser automation tool
          such as <strong className="text-teal-300">Playwright</strong> to extract
          the data.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card
          href="/reservations"
          title="Reservations"
          body="Paginated list of every reservation. Click into each one to reveal its per-night stay rows and the rest of the fields."
        />
        <Card
          href="/reference"
          title="Reference"
          body="Lookup tables for room types, market codes, and channels. Join these to the reservation fields."
        />
        <Card
          href="/verify"
          title="Verify"
          body="Live checksums for today's dataset. Check your loaded numbers against these to confirm your scrape is complete and correct."
        />
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-100">What to scrape</h2>
        <ul className="list-inside list-disc space-y-2 text-sm text-slate-300">
          <li>
            <strong>Master:</strong> the reservation list at{" "}
            <code className="text-teal-300">/reservations</code> — paginate through
            every page.
          </li>
          <li>
            <strong>Detail:</strong> open each reservation to capture its full
            fields and its <strong>stay rows</strong> (one row per night). Your
            fact table should be one row per reservation × stay date.
          </li>
          <li>
            <strong>Reference:</strong> the three lookup tables at{" "}
            <code className="text-teal-300">/reference</code>.
          </li>
        </ul>
        <p className="mt-4 text-sm text-slate-400">
          The data is regenerated every day and is always forward-looking from
          today, with a matching block of reservations from the same window one
          year ago for same-time-last-year comparisons. Scrape on the same day you
          run your agent.
        </p>
      </section>
    </div>
  );
}

function Card({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-slate-800 bg-slate-900/40 p-5 transition hover:border-teal-500/60 hover:bg-slate-900/70"
    >
      <h3 className="mb-2 text-base font-semibold text-teal-300">{title}</h3>
      <p className="text-sm text-slate-400">{body}</p>
    </Link>
  );
}
