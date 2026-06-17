'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Certificate } from '@/lib/types';
import { generateSeedCertificates } from '@/lib/demoSeed';

interface CertStore {
  certs: Certificate[];
  ready: boolean;
  /** Prepend newly-ingested documents to the queue. */
  addCertificates: (incoming: Certificate[]) => void;
  /** Record a reviewer's approve/reject decision. */
  recordDecision: (id: string, decision: 'approved' | 'rejected', note: string) => void;
}

const Ctx = createContext<CertStore | null>(null);

/**
 * Single source of truth for the certificate queue, shared across the review
 * page and the analytics dashboard. Seeded once on the client (timestamps are
 * generated at runtime, so seeding during SSR would cause hydration drift).
 */
export default function CertStoreProvider({ children }: { children: React.ReactNode }) {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCerts(generateSeedCertificates());
    setReady(true);
  }, []);

  const addCertificates = useCallback((incoming: Certificate[]) => {
    setCerts((prev) => [...incoming, ...prev]);
  }, []);

  const recordDecision = useCallback(
    (id: string, decision: 'approved' | 'rejected', note: string) => {
      setCerts((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: decision,
                reviewerNote: note.trim() || undefined,
                audit: [
                  ...c.audit,
                  {
                    at: new Date().toISOString(),
                    actor: 'reviewer' as const,
                    action: decision === 'approved' ? 'Approved by reviewer' : 'Rejected by reviewer',
                  },
                ],
              }
            : c
        )
      );
    },
    []
  );

  const value = useMemo(
    () => ({ certs, ready, addCertificates, recordDecision }),
    [certs, ready, addCertificates, recordDecision]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCerts(): CertStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCerts must be used within CertStoreProvider');
  return ctx;
}
