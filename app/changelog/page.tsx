import Link from "next/link";

export default function ChangelogPage() {
  return (
    <article className="prose prose-invert max-w-none space-y-6 text-slate-300">
      <h1 className="text-2xl font-bold text-slate-100">Dataset changelog</h1>

      <section>
        <h2 className="text-lg font-semibold text-teal-300">2026-06-12 — Reference expansion</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Added <strong>Rate plans</strong> and <strong>Macro group history</strong> tabs on `/reference`.</li>
          <li>
            <code className="text-teal-200">PROM</code> macro group reclassified effective 2025-06-01
            (Retail → Leisure Group). Join on stay date.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-teal-300">2026-06-12 — Detail page fields</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Detail pages show <code>financial_status</code> (<code>Posted</code> / <code>Provisional</code>).</li>
          <li>Detail pages show <code>property_date</code> (hotel business date).</li>
          <li>
            UI label <strong>Commercial rate code</strong> maps to column <code>rate_plan_code</code>.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-teal-300">2026-06-12 — Verification</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>
            <code>/verify</code> exposes <code>dataset_revision</code>, posted OTB aggregates, and{" "}
            <code>reservation_stay_status_sha256</code>.
          </li>
        </ul>
      </section>

      <p className="text-sm text-slate-500">
        <Link href="/verify" className="text-teal-400 hover:text-teal-300">
          Verify your load →
        </Link>
      </p>
    </article>
  );
}
