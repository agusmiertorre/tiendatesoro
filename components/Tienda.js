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

export default function Tienda() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState({}); // { [product_id]: cantidad }
  const [cartOpen, setCartOpen] = useState(false);

  // Traer productos al cargar la página
  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setProducts(data.products || []);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('No se pudo conectar con la tienda');
        setLoading(false);
      });
  }, []);

  // Cargar carrito guardado en localStorage al montar
  useEffect(() => {
    const saved = localStorage.getItem(CART_KEY);
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch {
        // si el JSON guardado está corrupto, arrancamos con carrito vacío
      }
    }
  }, []);

  // Guardar el carrito en localStorage cada vez que cambia
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
      if (newQty <= 0) {
        delete next[productId];
      } else {
        next[productId] = newQty;
      }
      return next;
    });
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
            Carrito ({itemCount})
          </button>
        </div>
      </header>

      <main className="catalog">
        <div className="wrap">
          <h1>Nuestros productos</h1>
          <p className="subtitle">
            Elegí las fotos y packs que querés para tu pedido.
          </p>

          {loading && <p className="state-msg">Cargando productos...</p>}
          {error && <p className="state-msg">{error}</p>}
          {!loading && !error && products.length === 0 && (
            <p className="state-msg">Todavía no hay productos cargados.</p>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="grid">
              {products.map((p) => {
                const inCart = cart[p.id] || 0;
                const sinStock = p.stock <= 0;
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
                      <button
                        className="add-btn"
                        disabled={sinStock}
                        onClick={() => addToCart(p.id)}
                      >
                        {sinStock
                          ? 'Sin stock'
                          : inCart > 0
                          ? `Agregar otra (${inCart} en carrito)`
                          : 'Agregar al carrito'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {cartOpen && (
        <>
          <div className="cart-overlay" onClick={() => setCartOpen(false)} />
          <div className="cart-drawer">
            <button className="cart-close" onClick={() => setCartOpen(false)}>
              ✕
            </button>
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
              <button className="checkout-btn" disabled={cartEntries.length === 0}>
                Continuar con la compra
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
