'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReviewQueue, { QueueFilter } from '@/components/ReviewQueue';
import CertDetail from '@/components/CertDetail';
import InsightsPanel from '@/components/InsightsPanel';
import { useCerts } from '@/components/CertStoreProvider';
import { buildCertificate } from '@/lib/certificate';
import { Certificate, DocumentPreview, Extraction } from '@/lib/types';

export default function Home() {
  const { certs, addCertificates, recordDecision } = useCerts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<QueueFilter>('all');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [mode, setMode] = useState<'mock' | 'live' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Select the first certificate once the queue has been seeded.
  useEffect(() => {
    if (!selectedId && certs.length > 0) setSelectedId(certs[0].id);
  }, [certs, selectedId]);

  const stats = useMemo(() => {
    const total = certs.length;
    const auto = certs.filter((c) => c.status === 'auto_approved').length;
    const pending = certs.filter((c) => c.status === 'needs_review').length;
    const done = certs.filter((c) => c.status === 'approved' || c.status === 'rejected').length;
    return { total, auto, pending, done };
  }, [certs]);

  const selected = certs.find((c) => c.id === selectedId) ?? null;

  async function extractOne(file: File): Promise<Certificate> {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] ?? '');
      };
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileBase64: base64,
        mediaType: file.type || 'application/pdf',
      }),
    });
    const data = (await res.json()) as {
      extraction?: Extraction;
      mode?: 'mock' | 'live';
      error?: string;
    };
    if (!res.ok || !data.extraction) {
      throw new Error(data.error ?? 'Extraction failed');
    }
    setMode(data.mode ?? null);
    const mediaType = file.type || 'application/pdf';
    const preview: DocumentPreview = {
      kind: mediaType === 'application/pdf' ? 'pdf' : 'image',
      dataUrl: `data:${mediaType};base64,${base64}`,
    };
    return buildCertificate({
      id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fileName: file.name,
      extraction: data.extraction,
      preview,
    });
  }

  async function handleUpload(files: File[]) {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    const failures: string[] = [];
    let firstId: string | null = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(`Extracting ${i + 1} of ${files.length}: ${file.name}`);
      try {
        const cert = await extractOne(file);
        if (!firstId) firstId = cert.id;
        addCertificates([cert]);
      } catch (err) {
        failures.push(`${file.name} (${err instanceof Error ? err.message : 'failed'})`);
      }
    }

    if (firstId) setSelectedId(firstId);
    if (failures.length > 0) {
      setError(`Could not process ${failures.length} file(s): ${failures.join(', ')}`);
    }
    setBusy(false);
    setProgress(null);
    if (fileInput.current) fileInput.current.value = '';
  }

  return (
    <main className="shell">
      <div className="topbar">
        <div className="brand">
          <h1>CertIQ</h1>
          <span>AI exemption certificate review · human-in-the-loop</span>
        </div>
        <div className="topbar-right">
          <nav className="topnav">
            <Link href="/" className="navlink active">
              Review queue
            </Link>
            <Link href="/dashboard" className="navlink">
              Dashboard
            </Link>
          </nav>
          <span className={`mode-pill ${mode === 'live' ? 'live' : ''}`}>
            {mode === 'live' ? 'Live extraction (Claude)' : 'Mock mode — add ANTHROPIC_API_KEY for live extraction'}
          </span>
        </div>
      </div>

      <InsightsPanel certs={certs} />

      <div className="stats">
        <div className="stat">
          <div className="label">Total documents</div>
          <div className="value">{stats.total}</div>
        </div>
        <div className="stat">
          <div className="label">Auto-approved</div>
          <div className="value">{stats.auto}</div>
        </div>
        <div className="stat">
          <div className="label">Awaiting review</div>
          <div className="value">{stats.pending}</div>
        </div>
        <div className="stat">
          <div className="label">Completed</div>
          <div className="value">{stats.done}</div>
        </div>
      </div>

      <div className="upload-zone">
        <p>
          Upload one or more exemption certificates (PDF, PNG, JPG). The AI extracts
          fields with per-field confidence; the rules engine decides whether a human
          needs to look. {busy && progress ? <b>{progress}</b> : null}
        </p>
        <div className="actions">
          <input
            ref={fileInput}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = e.target.files ? Array.from(e.target.files) : [];
              if (files.length) void handleUpload(files);
            }}
          />
          <button className="btn primary" disabled={busy} onClick={() => fileInput.current?.click()}>
            {busy ? 'Extracting…' : 'Upload certificates'}
          </button>
        </div>
      </div>

      {error && <div className="issue error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="layout">
        <ReviewQueue
          certs={certs}
          selectedId={selectedId}
          filter={filter}
          onSelect={setSelectedId}
          onFilter={setFilter}
        />
        {selected ? (
          <CertDetail cert={selected} onDecision={recordDecision} />
        ) : (
          <div className="panel">
            <div className="empty">Select a certificate to review.</div>
          </div>
        )}
      </div>
    </main>
  );
}
