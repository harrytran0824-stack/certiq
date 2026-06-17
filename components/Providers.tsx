'use client';

import CertStoreProvider from './CertStoreProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <CertStoreProvider>{children}</CertStoreProvider>;
}
