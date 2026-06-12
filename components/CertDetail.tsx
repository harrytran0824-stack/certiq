'use client';

import { useState } from 'react';
import { Certificate, FIELD_KEYS, FIELD_LABELS } from '@/lib/types';

interface Props {
  cert: Certificate;
  onDecision: (id: string, decision: 'approved' | 'rejected', note: string) => void;
}

function confColor(c: number): string {
  if (c >= 0.85) return 'var(--green)';
  if (c >= 0.6) return 'var(--amber)';
  return 'var(--red)';
}

export default function CertDetail({ cert, onDecision }: Props) {
  const [note, setNote] = useState('');
  const actionable = cert.status === 'needs_review' || cert.status === 'auto_approved';

  return (
    <div className="panel">
      <div className="detail">
        <h3>{cert.fileName}</h3>
        <div className="sub">
          Received {new Date(cert.receivedAt).toLocaleString()} · status:{' '}
          {cert.status.replace('_', ' ')}
        </div>

        {cert.issues.length > 0 && (
          <div className="issues">
            {cert.issues.map((issue, i) => (
              <div key={i} className={`issue ${issue.severity}`}>
                {issue.field ? <b>{FIELD_LABELS[issue.field]}: </b> : null}
                {issue.message}
              </div>
            ))}
          </div>
        )}

        <table className="fields">
          <thead>
            <tr>
              <th>Field</th>
              <th>Extracted value</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {FIELD_KEYS.map((key) => {
              const field = cert.extraction[key];
              return (
                <tr key={key}>
                  <td>{FIELD_LABELS[key]}</td>
                  <td className="val">{field.value}</td>
                  <td>
                    <div className="conf">
                      <div className="conf-track">
                        <div
                          className="conf-fill"
                          style={{
                            width: `${Math.round(field.confidence * 100)}%`,
                            background: confColor(field.confidence),
                          }}
                        />
                      </div>
                      <span className="conf-num">{Math.round(field.confidence * 100)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {actionable && (
          <>
            <textarea
              className="note"
              placeholder="Reviewer note (required to reject)…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="actions">
              <button
                className="btn approve"
                onClick={() => onDecision(cert.id, 'approved', note)}
              >
                Approve
              </button>
              <button
                className="btn reject"
                disabled={note.trim().length === 0}
                onClick={() => onDecision(cert.id, 'rejected', note)}
                title="A note is required to reject"
              >
                Reject
              </button>
            </div>
          </>
        )}

        {cert.reviewerNote && (
          <p>
            <b>Reviewer note:</b> {cert.reviewerNote}
          </p>
        )}

        <div className="audit">
          <h4>Audit trail</h4>
          {cert.audit.map((entry, i) => (
            <div key={i} className="audit-entry">
              <b>{entry.actor}</b> — {entry.action} ·{' '}
              {new Date(entry.at).toLocaleString()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
