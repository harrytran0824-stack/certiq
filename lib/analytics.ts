import { Certificate, FIELD_KEYS, FIELD_LABELS, FieldKey, IssueCode } from './types';

export interface Kpi {
  label: string;
  value: string;
  caption: string;
  tone: 'neutral' | 'good' | 'warn' | 'bad';
}

const ISSUE_LABEL: Record<IssueCode, string> = {
  low_confidence: 'Low confidence',
  missing_tax_id: 'Missing tax ID',
  expired: 'Expired',
  missing_signature: 'Missing signature',
  missing_field: 'Missing field',
  future_date: 'Future-dated',
};

const HARD = (c: IssueCode) => c === 'expired' || c === 'missing_signature';
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

export interface Analytics {
  kpis: Kpi[];
  disposition: { label: string; value: number; color: string }[];
  issuesByType: { label: string; value: number; color: string }[];
  volumeByState: { label: string; value: number }[];
  throughput: { xLabels: string[]; series: { label: string; color: string; data: number[] }[] };
  fieldConfidence: { label: string; value: number }[];
}

export function computeAnalytics(certs: Certificate[], now: Date = new Date()): Analytics {
  const total = certs.length;
  const counts = { auto_approved: 0, needs_review: 0, approved: 0, rejected: 0 };
  const issueCounts: Record<string, number> = {};
  const stateCounts: Record<string, number> = {};
  const fieldSum: Record<string, number> = {};
  let invalidCaught = 0;
  let confSum = 0;
  let confN = 0;

  const intake = [0, 0, 0, 0];
  const auto = [0, 0, 0, 0];

  for (const c of certs) {
    counts[c.status] += 1;

    let hasHard = false;
    for (const issue of c.issues) {
      issueCounts[issue.code] = (issueCounts[issue.code] ?? 0) + 1;
      if (HARD(issue.code)) hasHard = true;
    }
    if (hasHard) invalidCaught += 1;

    const stateVal = c.extraction.state.value.trim().toUpperCase();
    const stateKey = /^[A-Z]{2}$/.test(stateVal) ? stateVal : 'Other';
    stateCounts[stateKey] = (stateCounts[stateKey] ?? 0) + 1;

    for (const key of FIELD_KEYS) {
      const cf = c.extraction[key].confidence;
      fieldSum[key] = (fieldSum[key] ?? 0) + cf;
      confSum += cf;
      confN += 1;
    }

    const wk = Math.floor((now.getTime() - new Date(c.receivedAt).getTime()) / (7 * 86400000));
    if (wk >= 0 && wk <= 3) {
      intake[wk] += 1;
      if (c.status === 'auto_approved') auto[wk] += 1;
    }
  }

  const routedToHuman = total - counts.auto_approved;
  const avgConf = confN > 0 ? Math.round((confSum / confN) * 100) : 0;

  const kpis: Kpi[] = [
    { label: 'Documents processed', value: total.toLocaleString(), caption: 'Last 30 days', tone: 'good' },
    {
      label: 'Auto-approval rate',
      value: `${pct(counts.auto_approved, total)}%`,
      caption: 'Cleared without a human',
      tone: 'good',
    },
    {
      label: 'Awaiting review',
      value: counts.needs_review.toLocaleString(),
      caption: `${pct(routedToHuman, total)}% routed to a human`,
      tone: 'warn',
    },
    { label: 'Avg. extraction confidence', value: `${avgConf}%`, caption: 'Across all nine fields', tone: 'neutral' },
    {
      label: 'Invalid caught',
      value: invalidCaught.toLocaleString(),
      caption: 'Expired or unsigned — blocked',
      tone: 'bad',
    },
    {
      label: 'Rejected by reviewer',
      value: counts.rejected.toLocaleString(),
      caption: `${pct(counts.rejected, total)}% of intake · always human-decided`,
      tone: 'neutral',
    },
  ];

  const disposition = [
    { label: 'Auto-approved', value: counts.auto_approved, color: 'var(--green)' },
    { label: 'Needs review', value: counts.needs_review, color: 'var(--amber)' },
    { label: 'Approved by human', value: counts.approved, color: 'var(--accent)' },
    { label: 'Rejected', value: counts.rejected, color: 'var(--red)' },
  ];

  const issuesByType = (Object.keys(issueCounts) as IssueCode[])
    .map((code) => ({
      label: ISSUE_LABEL[code],
      value: issueCounts[code],
      color: HARD(code) || code === 'missing_tax_id' ? 'var(--red)' : 'var(--amber)',
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const stateEntries = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]);
  const topStates = stateEntries.filter(([k]) => k !== 'Other').slice(0, 8);
  const otherTotal =
    total - topStates.reduce((s, [, v]) => s + v, 0);
  const volumeByState = [
    ...topStates.map(([label, value]) => ({ label, value })),
    ...(otherTotal > 0 ? [{ label: 'Other', value: otherTotal }] : []),
  ];

  const throughput = {
    xLabels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
    series: [
      { label: 'Intake', color: 'var(--accent)', data: [intake[3], intake[2], intake[1], intake[0]] },
      { label: 'Auto-approved', color: 'var(--green)', data: [auto[3], auto[2], auto[1], auto[0]] },
    ],
  };

  const fieldConfidence = FIELD_KEYS.map((key: FieldKey) => ({
    label: FIELD_LABELS[key],
    value: total > 0 ? Math.round((fieldSum[key] / total) * 100) : 0,
  })).sort((a, b) => b.value - a.value);

  return { kpis, disposition, issuesByType, volumeByState, throughput, fieldConfidence };
}
