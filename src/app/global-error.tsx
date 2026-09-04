'use client';

// Jaring terakhir: dipakai kalau yang gagal adalah root layout sendiri, di mana
// `error.tsx` belum sempat terpasang. Berkas ini menggantikan seluruh dokumen,
// jadi gayanya ditulis inline — kalau chunk CSS ikut gagal dimuat (kasus build
// basi di edge), halaman ini tetap terbaca.

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#f9fafb',
          color: '#111827',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <title>Halaman gagal dimuat — Alisan</title>
        <div style={{ maxWidth: '420px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 12px' }}>
            Halaman gagal dimuat
          </h1>
          <p
            style={{
              fontSize: '14px',
              lineHeight: 1.6,
              color: '#6b7280',
              margin: '0 0 28px',
            }}
          >
            Terjadi gangguan saat memuat situs. Ini biasanya sementara — silakan
            coba lagi.
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              height: '48px',
              padding: '0 32px',
              border: 'none',
              borderRadius: '6px',
              background: '#16a34a',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Coba Lagi
          </button>
          {error.digest && (
            <p
              style={{
                marginTop: '32px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '10px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#9ca3af',
              }}
            >
              Kode: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
