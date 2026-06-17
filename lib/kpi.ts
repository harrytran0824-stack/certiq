/**
 * Illustrative KPI dataset for the analytics dashboard.
 *
 * CertIQ has no persistence yet, so these aggregates stand in for a realistic
 * month of processing for a mid-size tax team (~1,460 certificates). When a
 * database is added, replace this module with a query over the certificate
 * queue (status, issues, per-field confidence).
 *
 * Internal consistency (so the charts agree with each other):
 *   dispositions sum to 1,460   ·   state volumes sum to 1,460
 *   weekly intake sums to 1,460 ·   weekly auto-approved sums to 760
 */

export interface Kpi {
  label: string;
  value: string;
  caption: string;
  tone: 'neutral' | 'good' | 'warn' | 'bad';
}

export const KPIS: Kpi[] = [
  { label: 'Documents processed', value: '1,460', caption: 'Last 30 days · ▲ 8% vs. prior month', tone: 'good' },
  { label: 'Auto-approval rate', value: '52%', caption: '▲ 4 pts — clean resale certs cleared', tone: 'good' },
  { label: 'Awaiting review', value: '128', caption: 'Median 3.4 hrs to clear', tone: 'warn' },
  { label: 'Avg. extraction confidence', value: '92%', caption: 'Across all nine fields', tone: 'neutral' },
  { label: 'Invalid caught', value: '162', caption: 'Expired or unsigned — blocked', tone: 'bad' },
  { label: 'Rejected by reviewer', value: '110', caption: '7.5% of intake · always human-decided', tone: 'neutral' },
];

export const DISPOSITION = [
  { label: 'Auto-approved', value: 760, color: 'var(--green)' },
  { label: 'Needs review', value: 128, color: 'var(--amber)' },
  { label: 'Approved by human', value: 462, color: 'var(--accent)' },
  { label: 'Rejected', value: 110, color: 'var(--red)' },
];

export const ISSUES_BY_TYPE = [
  { label: 'Low confidence', value: 318, color: 'var(--amber)' },
  { label: 'Missing tax ID', value: 96, color: 'var(--red)' },
  { label: 'Expired', value: 88, color: 'var(--red)' },
  { label: 'Missing signature', value: 74, color: 'var(--red)' },
  { label: 'Future-dated', value: 19, color: 'var(--amber)' },
];

export const VOLUME_BY_STATE = [
  { label: 'CA', value: 268 },
  { label: 'TX', value: 232 },
  { label: 'NY', value: 176 },
  { label: 'FL', value: 169 },
  { label: 'IL', value: 121 },
  { label: 'PA', value: 98 },
  { label: 'OH', value: 92 },
  { label: 'GA', value: 84 },
  { label: 'Other', value: 220 },
];

export const THROUGHPUT = {
  xLabels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
  series: [
    { label: 'Intake', color: 'var(--accent)', data: [372, 341, 388, 359] },
    { label: 'Auto-approved', color: 'var(--green)', data: [193, 178, 202, 187] },
  ],
};

export const FIELD_CONFIDENCE = [
  { label: 'Signature', value: 97 },
  { label: 'State', value: 96 },
  { label: 'Purchaser name', value: 95 },
  { label: 'Seller name', value: 94 },
  { label: 'Issue date', value: 92 },
  { label: 'Purchaser address', value: 91 },
  { label: 'Expiration date', value: 90 },
  { label: 'Exemption reason', value: 87 },
  { label: 'Tax ID / permit', value: 84 },
];
