import Link from 'next/link';
import { Columns, Donut, HBars, Lines } from '@/components/Charts';
import {
  DISPOSITION,
  FIELD_CONFIDENCE,
  ISSUES_BY_TYPE,
  KPIS,
  THROUGHPUT,
  VOLUME_BY_STATE,
} from '@/lib/kpi';

export const metadata = {
  title: 'CertIQ — Compliance KPI dashboard',
};

export default function Dashboard() {
  return (
    <main className="shell">
      <div className="topbar">
        <div className="brand">
          <h1>CertIQ</h1>
          <span>Compliance KPI dashboard</span>
        </div>
        <nav className="topnav">
          <Link href="/" className="navlink">
            Review queue
          </Link>
          <Link href="/dashboard" className="navlink active">
            Dashboard
          </Link>
        </nav>
      </div>

      <section className="kpis">
        {KPIS.map((k) => (
          <div className={`kpi ${k.tone}`} key={k.label}>
            <div className="label">{k.label}</div>
            <div className="value">{k.value}</div>
            <div className="caption">{k.caption}</div>
          </div>
        ))}
      </section>

      <section className="viz-grid">
        <div className="insight-card">
          <div className="insight-title">Disposition mix · how 248 docs were routed</div>
          <Donut segments={DISPOSITION} />
        </div>

        <div className="insight-card">
          <div className="insight-title">Issues by type</div>
          <HBars items={ISSUES_BY_TYPE} />
        </div>

        <div className="insight-card">
          <div className="insight-title">Volume by state</div>
          <Columns data={VOLUME_BY_STATE} />
        </div>

        <div className="insight-card span2">
          <div className="insight-title">Weekly throughput · intake vs. auto-approved</div>
          <Lines xLabels={THROUGHPUT.xLabels} series={THROUGHPUT.series} />
        </div>

        <div className="insight-card">
          <div className="insight-title">Avg. confidence by field</div>
          <HBars
            items={FIELD_CONFIDENCE.map((f) => ({
              ...f,
              color: f.value >= 85 ? 'var(--green)' : f.value >= 60 ? 'var(--amber)' : 'var(--red)',
            }))}
            max={100}
            unit="%"
          />
        </div>
      </section>

      <p className="viz-note">
        Figures are illustrative sample data for the CertIQ demo. Wire these charts to live data by
        reading the certificate queue (status, issues, per-field confidence) once persistence is added.
      </p>
    </main>
  );
}
