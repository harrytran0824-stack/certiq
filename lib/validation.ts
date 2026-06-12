import { Extraction, FieldKey, ValidationIssue } from './types';

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

export function validateExtraction(extraction: Extraction): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const now = new Date();

  if (extraction.signaturePresent.value.trim().toLowerCase() !== 'yes') {
    issues.push({
      severity: 'error',
      field: 'signaturePresent',
      message: 'No signature detected. Unsigned certificates are not valid.',
    });
  }

  if (isBlank(extraction.taxIdNumber.value)) {
    issues.push({
      severity: 'error',
      field: 'taxIdNumber',
      message: 'Tax ID / permit number is missing.',
    });
  }

  if (isBlank(extraction.state.value)) {
    issues.push({
      severity: 'error',
      field: 'state',
      message: 'Issuing state could not be determined.',
    });
  }

  const exp = extraction.expirationDate.value;
  if (!isBlank(exp) && exp.trim().toLowerCase() !== 'none') {
    const expDate = new Date(exp);
    if (!isNaN(expDate.getTime()) && expDate < now) {
      issues.push({
        severity: 'error',
        field: 'expirationDate',
        message: `Certificate expired on ${exp}.`,
      });
    }
  }

  const issue = extraction.issueDate.value;
  if (!isBlank(issue)) {
    const issueDate = new Date(issue);
    if (!isNaN(issueDate.getTime()) && issueDate > now) {
      issues.push({
        severity: 'warning',
        field: 'issueDate',
        message: 'Issue date is in the future — possible extraction error.',
      });
    }
  }

  for (const field of CRITICAL_FIELDS) {
    if (extraction[field].confidence < CONFIDENCE_THRESHOLD) {
      issues.push({
        severity: 'warning',
        field,
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
