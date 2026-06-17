'use client';

/**
 * Tiny dependency-free chart primitives (inline SVG / CSS). Kept intentionally
 * small so the analytics page adds no third-party charting library.
 */

export function Donut({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 140 140" className="donut" role="img" aria-label="Disposition mix">
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
      <ul className="legend">
        {segments.map((s) => (
          <li key={s.label}>
            <span className="dot" style={{ background: s.color }} />
            {s.label}
            <b>{s.value}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal bars (good for ranked categories / percentages). */
export function HBars({
  items,
  max,
  unit = '',
}: {
  items: { label: string; value: number; color?: string }[];
  max?: number;
  unit?: string;
}) {
  const top = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="field-bars">
      {items.map((it) => (
        <div className="field-bar" key={it.label}>
          <span className="fb-label">{it.label}</span>
          <div className="track">
            <div
              className="fill"
              style={{ width: `${(it.value / top) * 100}%`, background: it.color ?? 'var(--accent)' }}
            />
          </div>
          <span className="fb-val">
            {it.value}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Vertical column chart. */
export function Columns({ data, color = 'var(--accent)' }: { data: { label: string; value: number }[]; color?: string }) {
  const w = 320;
  const h = 200;
  const pad = { l: 28, r: 8, t: 10, b: 24 };
  const max = Math.max(...data.map((d) => d.value), 1);
  const bw = (w - pad.l - pad.r) / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="svg-chart" role="img" aria-label="Volume by state">
      {[0, 0.5, 1].map((t) => {
        const y = pad.t + (h - pad.t - pad.b) * (1 - t);
        return (
          <g key={t}>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="var(--border)" strokeWidth="1" />
            <text x={pad.l - 6} y={y + 3} textAnchor="end" className="ax">
              {Math.round(max * t)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const bh = (h - pad.t - pad.b) * (d.value / max);
        const x = pad.l + i * bw + bw * 0.18;
        const y = h - pad.b - bh;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={bw * 0.64} height={bh} rx="3" fill={color} />
            <text x={x + bw * 0.32} y={h - pad.b + 14} textAnchor="middle" className="ax">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Multi-series line chart with soft area fill. */
export function Lines({
  xLabels,
  series,
}: {
  xLabels: string[];
  series: { label: string; color: string; data: number[] }[];
}) {
  const w = 660;
  const h = 220;
  const pad = { l: 32, r: 12, t: 12, b: 26 };
  const max = Math.max(...series.flatMap((s) => s.data), 1);
  const n = xLabels.length;
  const x = (i: number) => pad.l + ((w - pad.l - pad.r) * i) / Math.max(n - 1, 1);
  const y = (v: number) => pad.t + (h - pad.t - pad.b) * (1 - v / max);
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="svg-chart" role="img" aria-label="Weekly throughput">
        {[0, 0.5, 1].map((t) => {
          const gy = pad.t + (h - pad.t - pad.b) * (1 - t);
          return (
            <g key={t}>
              <line x1={pad.l} y1={gy} x2={w - pad.r} y2={gy} stroke="var(--border)" strokeWidth="1" />
              <text x={pad.l - 6} y={gy + 3} textAnchor="end" className="ax">
                {Math.round(max * t)}
              </text>
            </g>
          );
        })}
        {xLabels.map((lab, i) => (
          <text key={lab} x={x(i)} y={h - pad.b + 16} textAnchor="middle" className="ax">
            {lab}
          </text>
        ))}
        {series.map((s) => {
          const pts = s.data.map((v, i) => `${x(i)},${y(v)}`).join(' ');
          const area = `${pad.l},${h - pad.b} ${pts} ${x(n - 1)},${h - pad.b}`;
          return (
            <g key={s.label}>
              <polygon points={area} fill={s.color} opacity="0.08" />
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" />
              {s.data.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="#fff" stroke={s.color} strokeWidth="2" />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="chart-legend">
        {series.map((s) => (
          <span key={s.label}>
            <span className="dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
