'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminShell from '../../../components/AdminShell'

function formatPrice(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function AdminProductos() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/products')
    const data = await res.json()
    if (data.error) setError(data.error)
    else setProducts(data.products)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleActivo(product) {
    await fetch(`/api/admin/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, activo: !product.activo }),
    })
    load()
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (res.ok) load()
  }

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Productos</h1>
        <Link href="/admin/productos/nuevo" className="btn btn-gold">
          + Nuevo producto
        </Link>
      </div>

      {loading && <p className="state-msg">Cargando...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.imagen_url ? (
                      <img
                        src={p.imagen_url}
                        alt={p.nombre}
                        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 'var(--radius)' }}
                      />
                    ) : (
                      <div style={{ width: 48, height: 48, background: 'var(--surface-2)', borderRadius: 'var(--radius)' }} />
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                  <td style={{ color: 'var(--muted)' }}>{p.categoria || '—'}</td>
                  <td>{formatPrice(p.precio)}</td>
                  <td>{p.stock_infinito ? '∞' : p.stock}</td>
                  <td>
                    <span className={`badge ${p.activo ? 'badge-green' : 'badge-gray'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Link
                        href={`/admin/productos/${p.id}`}
                        className="btn btn-ghost btn-sm"
                      >
                        Editar
                      </Link>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => toggleActivo(p)}
                      >
                        {p.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(p.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {products.length === 0 && (
            <p className="state-msg">
              No hay productos aún.{' '}
              <Link href="/admin/productos/nuevo" style={{ color: 'var(--brand)', fontWeight: 700 }}>
                Crear el primero
              </Link>
            </p>
          )}
        </div>
      )}
    </AdminShell>
  )
}
