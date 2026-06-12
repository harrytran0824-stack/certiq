export type FieldKey =
  | 'purchaserName'
  | 'purchaserAddress'
  | 'sellerName'
  | 'state'
  | 'exemptionReason'
  | 'taxIdNumber'
  | 'signaturePresent'
  | 'issueDate'
  | 'expirationDate';

export interface ExtractedField {
  value: string;
  /** Model confidence for this field, 0–1 */
  confidence: number;
}

export type Extraction = Record<FieldKey, ExtractedField>;

export interface ValidationIssue {
  severity: 'error' | 'warning';
  field?: FieldKey;
  message: string;
}

export type CertStatus = 'auto_approved' | 'needs_review' | 'approved' | 'rejected';

export interface AuditEntry {
  at: string;
  actor: 'system' | 'reviewer';
  action: string;
}

export interface Certificate {
  id: string;
  fileName: string;
  receivedAt: string;
  extraction: Extraction;
  issues: ValidationIssue[];
  status: CertStatus;
  reviewerNote?: string;
  audit: AuditEntry[];
}

export const FIELD_KEYS: FieldKey[] = [
  'purchaserName',
  'purchaserAddress',
  'sellerName',
  'state',
  'exemptionReason',
  'taxIdNumber',
  'signaturePresent',
  'issueDate',
  'expirationDate',
];

export const FIELD_LABELS: Record<FieldKey, string> = {
  purchaserName: 'Purchaser name',
  purchaserAddress: 'Purchaser address',
  sellerName: 'Seller name',
  state: 'State',
  exemptionReason: 'Exemption reason',
  taxIdNumber: 'Tax ID / permit number',
  signaturePresent: 'Signature present',
  issueDate: 'Issue date',
  expirationDate: 'Expiration date',
};
