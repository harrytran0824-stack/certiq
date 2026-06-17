import { AuditEntry, Certificate, DocumentPreview, Extraction } from './types';
import { sampleDocDataUrl } from './preview';
import { suggestStatus, validateExtraction } from './validation';

export interface BuildOptions {
  id: string;
  fileName: string;
  extraction: Extraction;
  preview?: DocumentPreview;
  /** When the document was received. Defaults to now. */
  receivedAt?: Date;
  /** A pre-recorded human decision (used to seed historical, resolved items). */
  decision?: { status: 'approved' | 'rejected'; note?: string; at?: Date };
}

/**
 * Turn an extraction into a fully-formed Certificate: run the rules engine,
 * derive the routing status, build the audit trail, and attach a preview.
 * Shared by the live upload path and the demo seed so both go through the
 * exact same validation logic.
 */
export function buildCertificate(opts: BuildOptions): Certificate {
  const { id, fileName, extraction, preview, receivedAt, decision } = opts;
  const issues = validateExtraction(extraction);
  const routed = suggestStatus(issues);
  const at = (receivedAt ?? new Date()).toISOString();

  const audit: AuditEntry[] = [
    { at, actor: 'system' as const, action: 'Document ingested and fields extracted' },
    {
      at,
      actor: 'system' as const,
      action:
        routed === 'auto_approved'
          ? 'Passed all validation rules — auto-approved'
          : `Routed to human review (${issues.length} issue${issues.length > 1 ? 's' : ''})`,
    },
  ];

  let status: Certificate['status'] = routed;
  let reviewerNote: string | undefined;

  if (decision) {
    status = decision.status;
    reviewerNote = decision.note;
    audit.push({
      at: (decision.at ?? new Date()).toISOString(),
      actor: 'reviewer' as const,
      action: decision.status === 'approved' ? 'Approved by reviewer' : 'Rejected by reviewer',
    });
  }

  return {
    id,
    fileName,
    receivedAt: at,
    extraction,
    issues,
    status,
    reviewerNote,
    preview: preview ?? { kind: 'sample', dataUrl: sampleDocDataUrl(extraction, fileName) },
    audit,
  };
}
