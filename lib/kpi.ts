/**
 * Illustrative KPI dataset for the analytics dashboard.
 *
 * CertIQ has no persistence yet, so these aggregates stand in for "a month of
 * processing". When a database is added, replace this module with a query over
 * the certificate queue (status, issues, per-field confidence).
 */

export interface Kpi {
  label: string;
  value: string;
  caption: string;
  tone: 'neutral' | 'good' | 'warn' | 'bad';
}

export const KPIS: Kpi[] = [
  { label: 'Documents processed', value: '248', caption: '▲ 12% vs prev. period', tone: 'good' },
  { label: 'Auto-approval rate', value: '41%', caption: '▲ 6 pts — less manual work', tone: 'good' },
  { label: 'Awaiting review', value: '92', caption: '37% routed to a human', tone: 'warn' },
  { label: 'Avg. extraction confidence', value: '91%', caption: '▲ 2 pts', tone: 'neutral' },
  { label: 'Invalid caught', value: '23', caption: 'Expired / unsigned blocked', tone: 'bad' },
  { label: 'Rejected by reviewer', value: '17', caption: 'Every rejection is human-decided', tone: 'neutral' },
];

export const DISPOSITION = [
  { label: 'Auto-approved', value: 101, color: 'var(--green)' },
  { label: 'Needs review', value: 92, color: 'var(--amber)' },
  { label: 'Approved by human', value: 38, color: 'var(--accent)' },
  { label: 'Rejected', value: 17, color: 'var(--red)' },
];

export const ISSUES_BY_TYPE = [
  { label: 'Low confidence', value: 31, color: 'var(--amber)' },
  { label: 'Missing signature', value: 19, color: 'var(--red)' },
  { label: 'Expired', value: 23, color: 'var(--red)' },
  { label: 'Missing tax ID', value: 14, color: 'var(--red)' },
  { label: 'Future-dated', value: 5, color: 'var(--amber)' },
];

export const VOLUME_BY_STATE = [
  { label: 'TX', value: 58 },
  { label: 'CA', value: 47 },
  { label: 'FL', value: 39 },
  { label: 'NY', value: 31 },
  { label: 'OH', value: 24 },
  { label: 'IL', value: 18 },
  { label: 'Other', value: 31 },
];

export const THROUGHPUT = {
  xLabels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
  series: [
    { label: 'Intake', color: 'var(--accent)', data: [54, 61, 66, 67] },
    { label: 'Auto-approved', color: 'var(--green)', data: [20, 24, 28, 29] },
  ],
};

export const FIELD_CONFIDENCE = [
  { label: 'Signature', value: 97 },
  { label: 'Purchaser name', value: 96 },
  { label: 'Seller name', value: 95 },
  { label: 'State', value: 95 },
  { label: 'Purchaser address', value: 92 },
  { label: 'Issue date', value: 90 },
  { label: 'Expiration date', value: 88 },
  { label: 'Exemption reason', value: 86 },
  { label: 'Tax ID / permit', value: 83 },
];
