import Link from 'next/link';

const ESTADOS = {
  approved: {
    titulo: '¡Pedido confirmado!',
    mensaje: 'Tu pago fue aprobado. Vamos a preparar tus fotos con mucho cuidado.',
    color: '#065f46',
    bg: '#d1fae5',
    icono: '✓',
  },
  failure: {
    titulo: 'El pago no se completó',
    mensaje: 'Hubo un problema con el pago. Podés intentarlo de nuevo cuando quieras.',
    color: '#991b1b',
    bg: '#fee2e2',
    icono: '✕',
  },
  pending: {
    titulo: 'Pago pendiente',
    mensaje: 'Tu pago está siendo procesado. Te notificaremos cuando se confirme.',
    color: '#92400e',
    bg: '#fef3c7',
    icono: '⏳',
  },
};

export default function Gracias({ searchParams }) {
  const status = searchParams?.status || 'pending';
  const estado = ESTADOS[status] || ESTADOS.pending;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <header className="topbar">
        <div className="wrap">
          <div className="brand">
            Tesoro <span className="gold">Estudio</span>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px 40px',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{
            width: 64, height: 64,
            borderRadius: '50%',
            background: estado.bg,
            color: estado.color,
            fontSize: '1.6rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            {estado.icono}
          </div>

          <h1 style={{ fontSize: '1.8rem', color: 'var(--brand)', marginBottom: 12 }}>
            {estado.titulo}
          </h1>

          <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: 32 }}>
            {estado.mensaje}
          </p>

          <Link
            href="/"
            style={{
              display: 'inline-block',
              background: 'var(--gold)',
              color: 'var(--brand-ink)',
              padding: '12px 28px',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
            }}
          >
            Volver a la tienda
          </Link>
        </div>
      </main>
    </div>
  );
}
