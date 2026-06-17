import { Certificate, Extraction, FieldKey } from './types';
import { buildCertificate } from './certificate';
import { SAMPLE_DOCS } from './mock';

/**
 * Deterministic, realistic demo dataset.
 *
 * Generates a month of certificates (run through the real rules engine) plus
 * the four hand-authored sample documents. Everything the dashboard shows is
 * computed from these records, so the charts reflect actual Certificate data —
 * and any document the user uploads is added to the same store and counts too.
 */

// Small seeded PRNG (mulberry32) so the demo looks the same on every load.
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STATES: { code: string; city: string; weight: number }[] = [
  { code: 'CA', city: 'Los Angeles', weight: 18 },
  { code: 'TX', city: 'Dallas', weight: 16 },
  { code: 'NY', city: 'Brooklyn', weight: 12 },
  { code: 'FL', city: 'Miami', weight: 11 },
  { code: 'IL', city: 'Chicago', weight: 8 },
  { code: 'PA', city: 'Philadelphia', weight: 7 },
  { code: 'OH', city: 'Columbus', weight: 6 },
  { code: 'GA', city: 'Atlanta', weight: 6 },
  { code: 'WA', city: 'Seattle', weight: 4 },
  { code: 'NC', city: 'Charlotte', weight: 4 },
  { code: 'MI', city: 'Detroit', weight: 4 },
  { code: 'AZ', city: 'Phoenix', weight: 4 },
];

const REASONS = ['Resale', 'Resale', 'Resale', 'Manufacturing', 'Government', 'Nonprofit', 'Agricultural'];
const PREFIX = ['Acme', 'BrightMart', 'Summit', 'Lone Star', 'Empire', 'Greenfield', 'Coastal', 'Pioneer',
  'Vertex', 'Cedar', 'Hudson', 'Buckeye', 'Sunbelt', 'Northwind', 'Ironclad', 'Riverside', 'Apex', 'Golden Gate'];
const SUFFIX = ['Supply Co', 'Wholesale Inc', 'Distribution LLC', 'Industrial', 'Trading Group',
  'Components Inc', 'Retail Group', 'Manufacturing Corp', 'Logistics', 'Partners LLC'];

function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)];
}
function pickState(r: () => number) {
  const total = STATES.reduce((s, x) => s + x.weight, 0);
  let n = r() * total;
  for (const s of STATES) {
    n -= s.weight;
    if (n <= 0) return s;
  }
  return STATES[0];
}
function company(r: () => number) {
  return `${pick(r, PREFIX)} ${pick(r, SUFFIX)}`;
}
function f(value: string, confidence: number) {
  return { value, confidence: Math.max(0, Math.min(1, confidence)) };
}
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

const FIELD_BASE: Record<FieldKey, number> = {
  purchaserName: 0.96,
  purchaserAddress: 0.93,
  sellerName: 0.95,
  state: 0.98,
  exemptionReason: 0.9,
  taxIdNumber: 0.89,
  signaturePresent: 0.98,
  issueDate: 0.94,
  expirationDate: 0.92,
};

export function generateSeedCertificates(now: Date = new Date()): Certificate[] {
  const r = rng(20260617);
  const certs: Certificate[] = [];
  const N = 236;

  for (let i = 0; i < N; i++) {
    const st = pickState(r);
    const reason = pick(r, REASONS);
    const purchaser = company(r);
    const seller = company(r);
    const addr = `${100 + Math.floor(r() * 8900)} Commerce St, ${st.city}, ${st.code}`;

    // Received over the last 28 days.
    const ageDays = Math.floor(r() * 28);
    const received = new Date(now.getTime() - ageDays * 86400000 - Math.floor(r() * 86400000));

    // Issue date 1–22 months ago; rare future-dated extraction error.
    const issue = new Date(received.getTime() - (30 + Math.floor(r() * 640)) * 86400000);
    const futureGlitch = r() < 0.02;
    const issueDate = futureGlitch ? isoDate(new Date(now.getTime() + 40 * 86400000)) : isoDate(issue);

    // Expiration: ~55% none; otherwise valid or already expired.
    let expiration = 'none';
    const eRoll = r();
    if (eRoll > 0.55) {
      const expired = r() < 0.18;
      const exp = expired
        ? new Date(now.getTime() - (10 + Math.floor(r() * 400)) * 86400000)
        : new Date(now.getTime() + (30 + Math.floor(r() * 500)) * 86400000);
      expiration = isoDate(exp);
    }

    const signed = r() > 0.07;
    const taxMissing = r() < 0.05;
    const taxId = taxMissing ? 'not found' : `${10 + Math.floor(r() * 89)}-${1000000 + Math.floor(r() * 8999999)}`;

    // Confidence: base ± noise, with occasional low-confidence reads.
    const conf = (key: FieldKey) => {
      const dip = r() < 0.09 ? 0.15 + r() * 0.18 : r() * 0.04;
      return FIELD_BASE[key] - dip;
    };

    const extraction: Extraction = {
      purchaserName: f(purchaser, conf('purchaserName')),
      purchaserAddress: f(addr, conf('purchaserAddress')),
      sellerName: f(seller, conf('sellerName')),
      state: f(st.code, conf('state')),
      exemptionReason: f(
        reason === 'Manufacturing' ? 'Manufacturing / ingredient or component part' : reason,
        conf('exemptionReason')),
      taxIdNumber: f(taxId, taxMissing ? 0.35 : conf('taxIdNumber')),
      signaturePresent: f(signed ? 'yes' : 'no', signed ? 0.97 : 0.84),
      issueDate: f(issueDate, conf('issueDate')),
      expirationDate: f(expiration, conf('expirationDate')),
    };

    // Build (runs the rules engine), then simulate human decisions on older items.
    let decision: { status: 'approved' | 'rejected'; note?: string; at?: Date } | undefined;
    const cert0 = buildCertificate({ id: `seed-${i}`, fileName: '', extraction, receivedAt: received });
    if (cert0.status === 'needs_review' && ageDays >= 2) {
      const hardError = cert0.issues.some((x) => x.severity === 'error');
      const resolvedAt = new Date(received.getTime() + (1 + r() * 2) * 86400000);
      if (hardError) {
        if (r() < 0.7) decision = { status: 'rejected', note: 'Failed validation on review.', at: resolvedAt };
      } else if (r() < 0.82) {
        decision = { status: 'approved', at: resolvedAt };
      }
    }

    const fileName =
      `${st.code}_${reason.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8)}_${purchaser.split(' ')[0].toLowerCase()}` +
      (extraction.taxIdNumber.confidence < 0.6 ? '_scan.jpg' : '.pdf');

    certs.push(
      decision
        ? buildCertificate({ id: `seed-${i}`, fileName, extraction, receivedAt: received, decision })
        : { ...cert0, fileName }
    );
  }

  // Prepend the four hand-authored samples as the most recent arrivals.
  const detailed = SAMPLE_DOCS.map((s, i) =>
    buildCertificate({
      id: s.id,
      fileName: s.fileName,
      extraction: s.extraction,
      receivedAt: new Date(now.getTime() - i * 3600000),
    })
  );

  return [...detailed, ...certs];
}
