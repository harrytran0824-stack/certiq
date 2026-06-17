'use client';

import { useMemo } from 'react';
import { Certificate, FIELD_KEYS, FIELD_LABELS } from '@/lib/types';

interface Props {
  certs: Certificate[];
}

const STATUS_META: { key: Certificate['status']; label: string; color: string }[] = [
  { key: 'auto_approved', label: 'Auto-approved', color: 'var(--green)' },
  { key: 'needs_review', label: 'Needs review', color: 'var(--amber)' },
  { key: 'approved', label: 'Approved', color: 'var(--accent)' },
  { key: 'rejected', label: 'Rejected', color: 'var(--red)' },
];

/** Donut chart rendered as stacked SVG arcs — no charting dependency. */
function Donut({ segments, total }: { segments: { value: number; color: string }[]; total: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 140 140" className="donut" role="img" aria-label="Status distribution">
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border)" strokeWidth="16" />
      {total > 0 &&
        segments.map((s, i) => {
          if (s.value === 0) return null;
          const len = (s.value / total) * c;
          const seg = (
            <circle
              key={i}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
              strokeLinecap="butt"
            />
          );
          offset += len;
          return seg;
        })}
      <text x="70" y="66" textAnchor="middle" className="donut-num">
        {total}
      </text>
      <text x="70" y="84" textAnchor="middle" className="donut-cap">
        documents
      </text>
    </svg>
  );
}

export default function InsightsPanel({ certs }: Props) {
  const data = useMemo(() => {
    const total = certs.length;
    const counts: Record<Certificate['status'], number> = {
      auto_approved: 0,
      needs_review: 0,
      approved: 0,
      rejected: 0,
    };
    let errorCount = 0;
    let warnCount = 0;
    const confByField: Record<string, { sum: number; n: number }> = {};

    for (const cert of certs) {
      counts[cert.status] += 1;
      for (const issue of cert.issues) {
        if (issue.severity === 'error') errorCount += 1;
        else warnCount += 1;
      }
      for (const key of FIELD_KEYS) {
        const f = (confByField[key] ??= { sum: 0, n: 0 });
        f.sum += cert.extraction[key].confidence;
        f.n += 1;
      }
    }

    const cleared = counts.auto_approved + counts.approved;
    const touchRate = total > 0 ? counts.needs_review / total : 0;
    const autoRate = total > 0 ? counts.auto_approved / total : 0;

    const fieldConfidence = FIELD_KEYS.map((key) => ({
      key,
      label: FIELD_LABELS[key],
      avg: confByField[key] ? confByField[key].sum / confByField[key].n : 0,
    })).sort((a, b) => a.avg - b.avg);

    return { total, counts, cleared, touchRate, autoRate, errorCount, warnCount, fieldConfidence };
  }, [certs]);

  const segments = STATUS_META.map((s) => ({ value: data.counts[s.key], color: s.color }));

  function confColor(c: number): string {
    if (c >= 0.85) return 'var(--green)';
    if (c >= 0.6) return 'var(--amber)';
    return 'var(--red)';
  }

  return (
    <section className="insights">
      <div className="insight-card">
        <div className="insight-title">Queue composition</div>
        <div className="donut-wrap">
          <Donut segments={segments} total={data.total} />
          <ul className="legend">
            {STATUS_META.map((s) => (
              <li key={s.key}>
                <span className="dot" style={{ background: s.color }} />
                {s.label}
                <b>{data.counts[s.key]}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="insight-card">
        <div className="insight-title">Automation impact</div>
        <div className="metric-row">
          <div className="big-metric">
            <span className="big-num" style={{ color: 'var(--green)' }}>
              {Math.round(data.autoRate * 100)}%
            </span>
            <span className="big-cap">auto-approved without a human</span>
          </div>
        </div>
        <div className="mini-bars">
          <div className="mini-bar">
            <span className="mini-label">Routed to review</span>
            <div className="track">
              <div
                className="fill"
                style={{ width: `${Math.round(data.touchRate * 100)}%`, background: 'var(--amber)' }}
              />
            </div>
            <span className="mini-val">{Math.round(data.touchRate * 100)}%</span>
          </div>
          <div className="chips">
            <span className="chip error">{data.errorCount} errors</span>
            <span className="chip warn">{data.warnCount} warnings</span>
            <span className="chip ok">{data.cleared} cleared</span>
          </div>
        </div>
      </div>

      <div className="insight-card">
        <div className="insight-title">Avg. field confidence</div>
        <div className="field-bars">
          {data.fieldConfidence.slice(0, 6).map((f) => (
            <div className="field-bar" key={f.key}>
              <span className="fb-label">{f.label}</span>
              <div className="track">
                <div
                  className="fill"
                  style={{ width: `${Math.round(f.avg * 100)}%`, background: confColor(f.avg) }}
                />
              </div>
              <span className="fb-val">{Math.round(f.avg * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
