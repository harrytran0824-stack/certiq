'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Columns, Donut, HBars, Lines } from '@/components/Charts';
import { useCerts } from '@/components/CertStoreProvider';
import { computeAnalytics } from '@/lib/analytics';

export default function DashboardClient() {
  const { certs, ready } = useCerts();
  const a = useMemo(() => computeAnalytics(certs), [certs]);
  const total = certs.length;

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

      {!ready ? (
        <div className="empty">Computing metrics from the queue…</div>
      ) : (
        <>
          <section className="kpis">
            {a.kpis.map((k) => (
              <div className={`kpi ${k.tone}`} key={k.label}>
                <div className="label">{k.label}</div>
                <div className="value">{k.value}</div>
                <div className="caption">{k.caption}</div>
              </div>
            ))}
          </section>

          <section className="viz-grid">
            <div className="insight-card">
              <div className="insight-title">
                Disposition mix · how {total.toLocaleString()} docs were routed
              </div>
              <Donut segments={a.disposition} />
            </div>

            <div className="insight-card">
              <div className="insight-title">Issues by type</div>
              <HBars items={a.issuesByType} />
            </div>

            <div className="insight-card">
              <div className="insight-title">Volume by state</div>
              <Columns data={a.volumeByState} />
            </div>

            <div className="insight-card span2">
              <div className="insight-title">Weekly throughput · intake vs. auto-approved</div>
              <Lines xLabels={a.throughput.xLabels} series={a.throughput.series} />
            </div>

            <div className="insight-card">
              <div className="insight-title">Avg. confidence by field</div>
              <HBars
                items={a.fieldConfidence.map((fmt) => ({
                  ...fmt,
                  color: fmt.value >= 85 ? 'var(--green)' : fmt.value >= 60 ? 'var(--amber)' : 'var(--red)',
                }))}
                max={100}
                unit="%"
              />
            </div>
          </section>

          <p className="viz-note">
            Every figure above is computed live from the certificate queue (status, issues, and
            per-field confidence). Upload documents on the review page and these charts update.
          </p>
        </>
      )}
    </main>
  );
}
