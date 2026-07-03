'use client';

import { useEffect, useState } from 'react';

const CART_KEY = 'tesoro_cart_v1';

function formatPrice(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n);
}

const EMPTY_BUYER = {
  nombre: '',
  apellido: '',
  dni: '',
  institucion: '',
  grado_anio: '',
  alumno_nombre: '',
  alumno_apellido: '',
};

export default function Tienda() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);

  // Checkout
  const [step, setStep] = useState('cart'); // 'cart' | 'checkout'
  const [buyer, setBuyer] = useState(EMPTY_BUYER);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Instituciones para los selects
  const [instituciones, setInstituciones] = useState([]);
  const [selectedInstId, setSelectedInstId] = useState('');
  const [selectedNivel, setSelectedNivel] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => {
        setError('No se pudo conectar con la tienda');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch('/api/instituciones')
      .then((r) => r.json())
      .then((d) => setInstituciones(d.instituciones || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(CART_KEY);
    if (saved) {
      try { setCart(JSON.parse(saved)); } catch { /* carrito corrupto, ignorar */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  function addToCart(productId) {
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  }

  function changeQty(productId, delta) {
    setCart((prev) => {
      const next = { ...prev };
      const newQty = (next[productId] || 0) + delta;
      if (newQty <= 0) delete next[productId];
      else next[productId] = newQty;
      return next;
    });
  }

  function closeCart() {
    setCartOpen(false);
    setStep('cart');
    setCheckoutError('');
  }

  function handleBuyerChange(e) {
    const { name, value } = e.target;
    setBuyer((p) => ({ ...p, [name]: value }));
  }

  // Datos derivados para los selects en cascada
  const instSeleccionada = instituciones.find((i) => i.id === selectedInstId);
  const nivelesDisponibles = instSeleccionada?.niveles || [];
  const nivelSeleccionado = nivelesDisponibles.find((n) => n.id === selectedNivel);
  const divisionesDisponibles = nivelSeleccionado?.divisiones || [];

  function handleInstChange(e) {
    const id = e.target.value;
    const inst = instituciones.find((i) => i.id === id);
    setSelectedInstId(id);
    setSelectedNivel('');
    setBuyer((p) => ({ ...p, institucion: inst?.nombre || '', grado_anio: '' }));
  }

  function handleNivelChange(e) {
    setSelectedNivel(e.target.value);
    setBuyer((p) => ({ ...p, grado_anio: '' }));
  }

  function handleDivisionChange(e) {
    const nivel = nivelesDisponibles.find((n) => n.id === selectedNivel);
    const div = nivel?.divisiones?.find((d) => d.id === e.target.value);
    setBuyer((p) => ({
      ...p,
      grado_anio: div ? `${nivel.nombre} - ${div.nombre}` : '',
    }));
  }

  async function handleCheckout(e) {
    e.preventDefault();
    setSubmitting(true);
    setCheckoutError('');

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyer,
        items: cartEntries.map(({ product, qty }) => ({
          product_id: product.id,
          cantidad: qty,
        })),
      }),
    });

    const data = await res.json();

    if (data.error) {
      setCheckoutError(data.error);
      setSubmitting(false);
      return;
    }

    setCart({});
    window.location.href = data.init_point;
  }

  const cartEntries = Object.entries(cart)
    .map(([productId, qty]) => {
      const product = products.find((p) => p.id === productId);
      return product ? { product, qty } : null;
    })
    .filter(Boolean);

  const total = cartEntries.reduce((sum, e) => sum + e.product.precio * e.qty, 0);
  const itemCount = cartEntries.reduce((sum, e) => sum + e.qty, 0);

  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <div className="brand">
            Tesoro <span className="gold">Estudio</span>
          </div>
          <button className="cart-toggle" onClick={() => setCartOpen(true)}>
            Carrito
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </button>
        </div>
      </header>

      <main className="catalog" style={{ minHeight: 'calc(100vh - 140px)' }}>
        <div className="wrap">
          <h1>Nuestros productos</h1>
          <p className="subtitle">Elegí las fotos y packs que querés para tu pedido.</p>

          {loading && <p className="state-msg">Cargando productos...</p>}
          {error && <p className="state-msg">{error}</p>}
          {!loading && !error && products.length === 0 && (
            <p className="state-msg">Todavía no hay productos cargados.</p>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="grid">
              {products.map((p) => {
                const qty = cart[p.id] || 0;
                const sinStock = !p.stock_infinito && p.stock <= 0;
                return (
                  <div className="card" key={p.id}>
                    <div className="card-img">
                      {p.imagen_url ? (
                        <img src={p.imagen_url} alt={p.nombre} />
                      ) : (
                        <span>Sin imagen todavía</span>
                      )}
                    </div>
                    <div className="card-body">
                      <h3>{p.nombre}</h3>
                      <p className="desc">{p.descripcion}</p>
                      <div className="price">{formatPrice(p.precio)}</div>

                      {sinStock ? (
                        <div className="add-btn add-btn--disabled">Sin stock</div>
                      ) : qty === 0 ? (
                        <button className="add-btn" onClick={() => addToCart(p.id)}>
                          Agregar al carrito
                        </button>
                      ) : (
                        <div className="qty-row">
                          <button className="qty-btn" onClick={() => changeQty(p.id, -1)}>−</button>
                          <span className="qty-num">{qty}</span>
                          <button className="qty-btn" onClick={() => changeQty(p.id, 1)}>+</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '24px 0 16px', borderTop: '1px solid var(--line)' }}>
        <a
          href="/admin/login"
          style={{ fontSize: '0.75rem', color: 'var(--line)', textDecoration: 'none' }}
        >
          admin
        </a>
      </footer>

      {cartOpen && (
        <>
          <div className="cart-overlay" onClick={closeCart} />
          <div className="cart-drawer">
            <button className="cart-close" onClick={closeCart}>✕</button>

            {step === 'cart' ? (
              <>
                <h2>Tu carrito</h2>

                {cartEntries.length === 0 ? (
                  <p className="cart-empty">Todavía no agregaste nada.</p>
                ) : (
                  <div className="cart-items">
                    {cartEntries.map(({ product, qty }) => (
                      <div className="cart-item" key={product.id}>
                        <div>
                          <div className="name">{product.nombre}</div>
                          <div className="qty-controls">
                            <button onClick={() => changeQty(product.id, -1)}>−</button>
                            <span>{qty}</span>
                            <button onClick={() => changeQty(product.id, 1)}>+</button>
                          </div>
                        </div>
                        <div>{formatPrice(product.precio * qty)}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="cart-footer">
                  <div className="cart-total">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <button
                    className="checkout-btn"
                    disabled={cartEntries.length === 0}
                    onClick={() => setStep('checkout')}
                  >
                    Continuar con la compra
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setStep('cart'); setCheckoutError(''); }}
                  style={{
                    background: 'none', border: 'none', color: 'var(--muted)',
                    fontSize: '0.875rem', padding: '0 0 4px', cursor: 'pointer',
                    textAlign: 'left', marginBottom: 4,
                  }}
                >
                  ← Volver al carrito
                </button>
                <h2>Datos del pedido</h2>

                <form
                  onSubmit={handleCheckout}
                  style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>

                    {/* Comprador */}
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', margin: '4px 0 0' }}>
                      Quién compra
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div className="form-group">
                        <label>Nombre *</label>
                        <input className="form-input" name="nombre" value={buyer.nombre} onChange={handleBuyerChange} required />
                      </div>
                      <div className="form-group">
                        <label>Apellido *</label>
                        <input className="form-input" name="apellido" value={buyer.apellido} onChange={handleBuyerChange} required />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>DNI *</label>
                      <input className="form-input" name="dni" value={buyer.dni} onChange={handleBuyerChange} required />
                    </div>

                    {/* Institución */}
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', margin: '4px 0 0' }}>
                      Institución
                    </p>

                    {instituciones.length > 0 ? (
                      <>
                        <div className="form-group">
                          <label>Escuela *</label>
                          <select
                            className="form-select"
                            value={selectedInstId}
                            onChange={handleInstChange}
                            required
                          >
                            <option value="">Seleccioná una institución...</option>
                            {instituciones.map((i) => (
                              <option key={i.id} value={i.id}>{i.nombre}</option>
                            ))}
                          </select>
                        </div>

                        {selectedInstId && nivelesDisponibles.length > 0 && (
                          <div className="form-group">
                            <label>Nivel</label>
                            <select
                              className="form-select"
                              value={selectedNivel}
                              onChange={handleNivelChange}
                            >
                              <option value="">Seleccioná un nivel...</option>
                              {nivelesDisponibles.map((n) => (
                                <option key={n.id} value={n.id}>{n.nombre}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {selectedNivel && divisionesDisponibles.length > 0 && (
                          <div className="form-group">
                            <label>División</label>
                            <select
                              className="form-select"
                              value={buyer.grado_anio ? divisionesDisponibles.find((d) => buyer.grado_anio.endsWith(d.nombre))?.id || '' : ''}
                              onChange={handleDivisionChange}
                            >
                              <option value="">Seleccioná una división...</option>
                              {divisionesDisponibles.map((d) => (
                                <option key={d.id} value={d.id}>{d.nombre}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="form-group">
                          <label>Nombre de la escuela *</label>
                          <input className="form-input" name="institucion" value={buyer.institucion} onChange={handleBuyerChange} required />
                        </div>
                        <div className="form-group">
                          <label>Grado / Año</label>
                          <input className="form-input" name="grado_anio" value={buyer.grado_anio} onChange={handleBuyerChange} placeholder="ej: 3° B" />
                        </div>
                      </>
                    )}

                    {/* Alumno */}
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', margin: '4px 0 0' }}>
                      Alumno/a
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div className="form-group">
                        <label>Nombre *</label>
                        <input className="form-input" name="alumno_nombre" value={buyer.alumno_nombre} onChange={handleBuyerChange} required />
                      </div>
                      <div className="form-group">
                        <label>Apellido *</label>
                        <input className="form-input" name="alumno_apellido" value={buyer.alumno_apellido} onChange={handleBuyerChange} required />
                      </div>
                    </div>

                  </div>

                  {/* Footer fijo */}
                  <div className="cart-footer" style={{ marginTop: 16 }}>
                    <div className="cart-total">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    {checkoutError && (
                      <p style={{ color: '#991b1b', background: '#fee2e2', padding: '8px 12px', borderRadius: 'var(--radius)', fontSize: '0.85rem', marginBottom: 12 }}>
                        {checkoutError}
                      </p>
                    )}
                    <button className="checkout-btn" type="submit" disabled={submitting}>
                      {submitting ? 'Procesando...' : `Ir a pagar ${formatPrice(total)}`}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
