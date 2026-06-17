import { Extraction } from './types';

export interface SampleDoc {
  id: string;
  fileName: string;
  note: string;
  extraction: Extraction;
}

function f(value: string, confidence: number) {
  return { value, confidence };
}

/**
 * Sample documents used to seed the queue and to power mock mode
 * (when no ANTHROPIC_API_KEY is configured).
 */
export const SAMPLE_DOCS: SampleDoc[] = [
  {
    id: 'sample-tx-clean',
    fileName: 'TX_resale_acme_supply.pdf',
    note: 'Clean Texas resale certificate — should auto-approve.',
    extraction: {
      purchaserName: f('Acme Supply Co LLC', 0.98),
      purchaserAddress: f('4410 Commerce St, Dallas, TX 75226', 0.96),
      sellerName: f('Lone Star Wholesale Inc', 0.97),
      state: f('TX', 0.99),
      exemptionReason: f('Resale', 0.97),
      taxIdNumber: f('1-75-2938465-7', 0.95),
      signaturePresent: f('yes', 0.99),
      issueDate: f('2026-03-14', 0.97),
      expirationDate: f('none', 0.93),
    },
  },
  {
    id: 'sample-fl-expired',
    fileName: 'FL_annual_resale_brightmart.pdf',
    note: 'Florida annual resale certificate — expired last year.',
    extraction: {
      purchaserName: f('BrightMart Retail Group', 0.97),
      purchaserAddress: f('801 Brickell Ave, Miami, FL 33131', 0.95),
      sellerName: f('Sunshine Distribution LLC', 0.96),
      state: f('FL', 0.99),
      exemptionReason: f('Resale', 0.96),
      taxIdNumber: f('78-8015966210-3', 0.94),
      signaturePresent: f('yes', 0.98),
      issueDate: f('2025-01-01', 0.96),
      expirationDate: f('2025-12-31', 0.97),
    },
  },
  {
    id: 'sample-ny-smudged',
    fileName: 'NY_ST120_scan_lowres.jpg',
    note: 'Low-resolution scan — smudged tax ID, missing signature.',
    extraction: {
      purchaserName: f('Hudson Valley Hardware', 0.91),
      purchaserAddress: f('212 Main St, Poughkeepsie, NY 12601', 0.88),
      sellerName: f('Empire Industrial Supply', 0.93),
      state: f('NY', 0.97),
      exemptionReason: f('Resale', 0.9),
      taxIdNumber: f('not found', 0.42),
      signaturePresent: f('no', 0.86),
      issueDate: f('2026-05-02', 0.83),
      expirationDate: f('none', 0.8),
    },
  },
  {
    id: 'sample-mtc-ambiguous',
    fileName: 'MTC_uniform_multistate_greenfield.pdf',
    note: 'Multistate MTC certificate — ambiguous exemption reason.',
    extraction: {
      purchaserName: f('Greenfield Manufacturing Corp', 0.96),
      purchaserAddress: f('1500 Industrial Pkwy, Columbus, OH 43228', 0.94),
      sellerName: f('Buckeye Components Inc', 0.95),
      state: f('OH', 0.92),
      exemptionReason: f('Manufacturing / ingredient or component part', 0.71),
      taxIdNumber: f('51-339920', 0.89),
      signaturePresent: f('yes', 0.97),
      issueDate: f('2026-04-22', 0.95),
      expirationDate: f('none', 0.85),
    },
  },
];

/**
 * Deterministic mock extraction for uploads when no API key is configured.
 *
 * Picks a sample by hashing the file name, so the same upload always yields the
 * same demo result and the route stays stateless (module-level counters don't
 * survive serverless cold starts and race across concurrent requests).
 */
export function mockExtract(fileName: string): Extraction {
  let hash = 0;
  for (let i = 0; i < fileName.length; i++) {
    hash = (hash * 31 + fileName.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % SAMPLE_DOCS.length;
  const base = SAMPLE_DOCS[index].extraction;
  return JSON.parse(JSON.stringify(base)) as Extraction;
}
