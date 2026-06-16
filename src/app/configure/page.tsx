import { Suspense } from 'react';
import ConfigureContent from '../ConfigureContent';

export default function ConfigurePage() {
  return (
    <Suspense
      fallback={
        <main style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Loading...</div>
        </main>
      }
    >
      <ConfigureContent />
    </Suspense>
  );
}
