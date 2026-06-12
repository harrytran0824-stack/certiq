'use client';

import { Certificate, CertStatus } from '@/lib/types';

export type QueueFilter = 'all' | 'needs_review' | 'auto_approved' | 'completed';

const STATUS_LABEL: Record<CertStatus, string> = {
  auto_approved: 'Auto-approved',
  needs_review: 'Needs review',
  approved: 'Approved',
  rejected: 'Rejected',
};

interface Props {
  certs: Certificate[];
  selectedId: string | null;
  filter: QueueFilter;
  onSelect: (id: string) => void;
  onFilter: (f: QueueFilter) => void;
}

export function matchesFilter(cert: Certificate, filter: QueueFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'completed') return cert.status === 'approved' || cert.status === 'rejected';
  return cert.status === filter;
}

export default function ReviewQueue({ certs, selectedId, filter, onSelect, onFilter }: Props) {
  const visible = certs.filter((c) => matchesFilter(c, filter));

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Intake queue</h2>
        <div className="tabs">
          {(
            [
              ['all', 'All'],
              ['needs_review', 'Review'],
              ['auto_approved', 'Auto'],
              ['completed', 'Done'],
            ] as [QueueFilter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              className={`tab ${filter === key ? 'active' : ''}`}
              onClick={() => onFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="queue">
        {visible.length === 0 && <div className="empty">No certificates in this view.</div>}
        {visible.map((cert) => {
          const errors = cert.issues.filter((i) => i.severity === 'error').length;
          const warnings = cert.issues.filter((i) => i.severity === 'warning').length;
          return (
            <button
              key={cert.id}
              className={`queue-item ${cert.id === selectedId ? 'selected' : ''}`}
              onClick={() => onSelect(cert.id)}
            >
              <div className="row1">
                <span className="fname">{cert.fileName}</span>
                <span className={`badge ${cert.status}`}>{STATUS_LABEL[cert.status]}</span>
              </div>
              <span className="meta">
                {cert.extraction.purchaserName.value} · {cert.extraction.state.value} ·{' '}
                {errors > 0 ? `${errors} error${errors > 1 ? 's' : ''}` : ''}
                {errors > 0 && warnings > 0 ? ', ' : ''}
                {warnings > 0 ? `${warnings} warning${warnings > 1 ? 's' : ''}` : ''}
                {errors === 0 && warnings === 0 ? 'no issues' : ''}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
