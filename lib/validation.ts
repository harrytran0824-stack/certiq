import { Extraction, FieldKey, IssueCode, ValidationIssue } from './types';

/**
 * Deterministic policy layer that sits on top of AI extraction.
 *
 * Design principle: the model extracts, the rules decide, the human reviews.
 * The system never auto-rejects — rejection is always a human decision.
 */

const CRITICAL_FIELDS: FieldKey[] = [
  'purchaserName',
  'taxIdNumber',
  'state',
  'exemptionReason',
];

const CONFIDENCE_THRESHOLD = 0.85;

function isBlank(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === '' || v === 'not found' || v === 'n/a' || v === 'unknown';
}

/** Midnight (local) for a Date, so comparisons are calendar-date based. */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Parse a date as a local calendar date. Bare "YYYY-MM-DD" strings are treated
 * as local — not UTC — so an expiration of "2025-12-31" doesn't read as expired
 * a day early for reviewers west of UTC.
 */
function parseDateOnly(value: string): Date | null {
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : startOfDay(d);
}

/** Fields that must be present (non-blank) for a certificate to be valid. */
const REQUIRED_FIELDS: { field: FieldKey; code: IssueCode; message: string }[] = [
  { field: 'purchaserName', code: 'missing_field', message: 'Purchaser name is missing.' },
  { field: 'taxIdNumber', code: 'missing_tax_id', message: 'Tax ID / permit number is missing.' },
  { field: 'state', code: 'missing_field', message: 'Issuing state could not be determined.' },
  { field: 'exemptionReason', code: 'missing_field', message: 'Exemption reason is missing.' },
];

export function validateExtraction(extraction: Extraction): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const today = startOfDay(new Date());

  if (extraction.signaturePresent.value.trim().toLowerCase() !== 'yes') {
    issues.push({
      severity: 'error',
      field: 'signaturePresent',
      code: 'missing_signature',
      message: 'No signature detected. Unsigned certificates are not valid.',
    });
  }

  for (const { field, code, message } of REQUIRED_FIELDS) {
    if (isBlank(extraction[field].value)) {
      issues.push({ severity: 'error', field, code, message });
    }
  }

  const exp = extraction.expirationDate.value;
  if (!isBlank(exp) && exp.trim().toLowerCase() !== 'none') {
    const expDate = parseDateOnly(exp);
    // A certificate is valid through its expiration date, so only flag once
    // the expiration day is strictly in the past.
    if (expDate && expDate < today) {
      issues.push({
        severity: 'error',
        field: 'expirationDate',
        code: 'expired',
        message: `Certificate expired on ${exp}.`,
      });
    }
  }

  const issue = extraction.issueDate.value;
  if (!isBlank(issue)) {
    const issueDate = parseDateOnly(issue);
    if (issueDate && issueDate > today) {
      issues.push({
        severity: 'warning',
        field: 'issueDate',
        code: 'future_date',
        message: 'Issue date is in the future — possible extraction error.',
      });
    }
  }

  for (const field of CRITICAL_FIELDS) {
    if (extraction[field].confidence < CONFIDENCE_THRESHOLD) {
      issues.push({
        severity: 'warning',
        field,
        code: 'low_confidence',
        message: `Low extraction confidence (${Math.round(
          extraction[field].confidence * 100
        )}%) — verify against the source document.`,
      });
    }
  }

  return issues;
}

/** Routing decision: clean documents skip the queue, everything else gets a human. */
export function suggestStatus(issues: ValidationIssue[]): 'auto_approved' | 'needs_review' {
  return issues.length === 0 ? 'auto_approved' : 'needs_review';
}
