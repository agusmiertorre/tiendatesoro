'use client'

import { useEffect, useState, Fragment } from 'react'
import AdminShell from '../../../components/AdminShell'

function formatPrice(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(str) {
  return new Date(str).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

const ESTADO_BADGE = {
  pending: 'badge-gold',
  approved: 'badge-green',
  rejected: 'badge-red',
}

const ESTADO_LABEL = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}

export default function AdminPedidos() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    fetch('/api/admin/orders')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setOrders(data.orders)
        setLoading(false)
      })
      .catch(() => {
        setError('No se pudieron cargar los pedidos')
        setLoading(false)
      })
  }, [])

  function toggleExpand(id) {
    setExpanded((prev) => (prev === id ? null : id))
  }

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Pedidos</h1>
        {!loading && (
          <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
          </span>
        )}
      </div>

      {loading && <p className="state-msg">Cargando...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Comprador</th>
                <th>DNI</th>
                <th>Institución / Grado</th>
                <th>Alumno/a</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <Fragment key={o.id}>
                  <tr>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: '0.82rem' }}>
                      {formatDate(o.created_at)}
                    </td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {o.nombre} {o.apellido}
                    </td>
                    <td>{o.dni}</td>
                    <td>
                      {o.institucion}
                      {o.grado_anio && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                          {o.grado_anio}
                        </div>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {o.alumno_nombre} {o.alumno_apellido}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--brand)', whiteSpace: 'nowrap' }}>
                      {formatPrice(o.total)}
                    </td>
                    <td>
                      <span className={`badge ${ESTADO_BADGE[o.estado] || 'badge-gray'}`}>
                        {ESTADO_LABEL[o.estado] || o.estado}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => toggleExpand(o.id)}
                      >
                        {expanded === o.id
                          ? 'Ocultar'
                          : `Ver (${o.order_items?.length ?? 0})`}
                      </button>
                    </td>
                  </tr>

                  {expanded === o.id && (
                    <tr>
                      <td
                        colSpan={8}
                        style={{ background: 'var(--surface)', padding: '12px 20px' }}
                      >
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {o.order_items?.map((item, i) => (
                            <li key={i} style={{ fontSize: '0.875rem' }}>
                              <strong>{item.product?.nombre || '(producto eliminado)'}</strong>
                              {' × '}{item.cantidad}
                              {' — '}
                              {formatPrice(item.precio_unitario * item.cantidad)}
                            </li>
                          ))}
                        </ul>
                        {o.mp_payment_id && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '8px 0 0' }}>
                            MP payment ID: {o.mp_payment_id}
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <p className="state-msg">Todavía no hay pedidos.</p>
          )}
        </div>
      )}
    </AdminShell>
  )
}
