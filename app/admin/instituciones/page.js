'use client'

import { useEffect, useState } from 'react'
import AdminShell from '../../../components/AdminShell'

export default function AdminInstituciones() {
  const [instituciones, setInstituciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [nuevaNombre, setNuevaNombre] = useState('')
  const [savingInst, setSavingInst] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/instituciones')
    const data = await res.json()
    setInstituciones(data.instituciones || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function crearInstitucion(e) {
    e.preventDefault()
    setSavingInst(true)
    await fetch('/api/admin/instituciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevaNombre }),
    })
    setNuevaNombre('')
    setSavingInst(false)
    load()
  }

  async function toggleInstitucion(inst) {
    await fetch(`/api/admin/instituciones/${inst.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: inst.nombre, activo: !inst.activo }),
    })
    load()
  }

  async function eliminarInstitucion(id) {
    if (!confirm('¿Eliminar esta institución y todo su contenido?')) return
    await fetch(`/api/admin/instituciones/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Instituciones</h1>
      </div>

      <form onSubmit={crearInstitucion} style={{ display: 'flex', gap: 10, marginBottom: 32, maxWidth: 480 }}>
        <input
          className="form-input"
          placeholder="Nombre de la institución..."
          value={nuevaNombre}
          onChange={(e) => setNuevaNombre(e.target.value)}
          required
        />
        <button className="btn btn-gold" type="submit" disabled={savingInst} style={{ whiteSpace: 'nowrap' }}>
          {savingInst ? 'Guardando...' : '+ Agregar'}
        </button>
      </form>

      {loading && <p className="state-msg">Cargando...</p>}
      {!loading && instituciones.length === 0 && (
        <p className="state-msg">No hay instituciones todavía.</p>
      )}

      {!loading && instituciones.map((inst) => (
        <InstitucionCard
          key={inst.id}
          inst={inst}
          onToggle={() => toggleInstitucion(inst)}
          onEliminar={() => eliminarInstitucion(inst.id)}
          onReload={load}
        />
      ))}
    </AdminShell>
  )
}

function InstitucionCard({ inst, onToggle, onEliminar, onReload }) {
  const [nuevoNivel, setNuevoNivel] = useState('')
  const [savingNivel, setSavingNivel] = useState(false)

  async function crearNivel(e) {
    e.preventDefault()
    setSavingNivel(true)
    await fetch('/api/admin/niveles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ institucion_id: inst.id, nombre: nuevoNivel }),
    })
    setNuevoNivel('')
    setSavingNivel(false)
    onReload()
  }

  async function eliminarNivel(id) {
    if (!confirm('¿Eliminar este nivel y todas sus divisiones?')) return
    await fetch(`/api/admin/niveles/${id}`, { method: 'DELETE' })
    onReload()
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius)',
      marginBottom: 24,
      overflow: 'hidden',
    }}>
      {/* Header institución */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        background: 'var(--surface-2)',
        borderBottom: '1px solid var(--line)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{inst.nombre}</span>
          <span className={`badge ${inst.activo ? 'badge-green' : 'badge-gray'}`}>
            {inst.activo ? 'Activa' : 'Inactiva'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={onToggle}>
            {inst.activo ? 'Desactivar' : 'Activar'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={onEliminar}>Eliminar</button>
        </div>
      </div>

      {/* Niveles */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {inst.niveles?.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
            Sin niveles todavía.
          </p>
        )}

        {inst.niveles?.map((nivel) => (
          <NivelTable
            key={nivel.id}
            nivel={nivel}
            onEliminarNivel={() => eliminarNivel(nivel.id)}
            onReload={onReload}
          />
        ))}

        {/* Agregar nivel */}
        <form onSubmit={crearNivel} style={{ display: 'flex', gap: 8, borderTop: '1px dashed var(--line)', paddingTop: 16 }}>
          <input
            className="form-input"
            placeholder="Nuevo nivel (ej: Inicial, Primaria, Secundaria)"
            value={nuevoNivel}
            onChange={(e) => setNuevoNivel(e.target.value)}
            style={{ maxWidth: 320 }}
            required
          />
          <button className="btn btn-primary btn-sm" type="submit" disabled={savingNivel}>
            + Nivel
          </button>
        </form>
      </div>
    </div>
  )
}

const GRADO_LABELS = ['1°', '2°', '3°', '4°', '5°', '6°', '7°']

function NivelTable({ nivel, onEliminarNivel, onReload }) {
  const [nuevaDiv, setNuevaDiv] = useState('')
  const [saving, setSaving] = useState(false)
  const [sorted, setSorted] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editNombre, setEditNombre] = useState('')

  // Carga rápida
  const [showBulk, setShowBulk] = useState(false)
  const [bulkMode, setBulkMode] = useState('lista') // 'lista' | 'grados'
  const [bulkLista, setBulkLista] = useState('')
  const [gradoDesde, setGradoDesde] = useState(0)
  const [gradoHasta, setGradoHasta] = useState(5)
  const [sufijos, setSufijos] = useState('')
  const [savingBulk, setSavingBulk] = useState(false)

  const divisiones = sorted
    ? [...(nivel.divisiones || [])].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    : (nivel.divisiones || [])

  async function crearDivision(e) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/admin/divisiones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nivel_id: nivel.id, nombre: nuevaDiv }),
    })
    setNuevaDiv('')
    setSaving(false)
    onReload()
  }

  async function guardarEdicion(id) {
    await fetch(`/api/admin/divisiones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: editNombre }),
    })
    setEditingId(null)
    onReload()
  }

  async function eliminarDivision(id) {
    await fetch(`/api/admin/divisiones/${id}`, { method: 'DELETE' })
    onReload()
  }

  // Genera preview de nombres según el modo
  function generarNombres() {
    if (bulkMode === 'lista') {
      return bulkLista.split('\n').map((s) => s.trim()).filter(Boolean)
    }
    const grades = GRADO_LABELS.slice(gradoDesde, gradoHasta + 1)
    const suf = sufijos.split(',').map((s) => s.trim()).filter(Boolean)
    if (!suf.length) return grades.map((g) => g)
    return grades.flatMap((g) => suf.map((s) => `${g} ${s}`))
  }

  const preview = generateSafe(generarNombres)

  async function crearBulk() {
    if (!preview.length) return
    setSavingBulk(true)
    await fetch('/api/admin/divisiones/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nivel_id: nivel.id, nombres: preview }),
    })
    setBulkLista('')
    setSufijos('')
    setShowBulk(false)
    setSavingBulk(false)
    onReload()
  }

  return (
    <div>
      {/* Header nivel */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontWeight: 700, color: 'var(--brand)', fontSize: '0.95rem' }}>
          {nivel.nombre}
        </span>
        <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
          ({divisiones.length} {divisiones.length === 1 ? 'división' : 'divisiones'})
        </span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setSorted((s) => !s)}
          style={{ fontSize: '0.75rem', padding: '3px 10px' }}
        >
          {sorted ? 'Orden original' : 'A → Z'}
        </button>
        <button
          onClick={onEliminarNivel}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem',
          }}
        >
          Eliminar nivel
        </button>
      </div>

      {/* Tabla de divisiones */}
      {divisiones.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10, fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              <th style={thStyle}>División</th>
              <th style={{ ...thStyle, width: 140 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {divisiones.map((div) => (
              <tr key={div.id} style={{ borderBottom: '1px solid var(--line)' }}>
                {/* Nombre / edición inline */}
                <td style={tdStyle}>
                  {editingId === div.id ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        className="form-input"
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') guardarEdicion(div.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                      />
                      <button className="btn btn-primary btn-sm" onClick={() => guardarEdicion(div.id)}>✓</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>✕</button>
                    </div>
                  ) : (
                    <span>{div.nombre}</span>
                  )}
                </td>

                {/* Acciones */}
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setEditingId(div.id); setEditNombre(div.nombre) }}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => eliminarDivision(div.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {divisiones.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: 8 }}>Sin divisiones todavía.</p>
      )}

      {/* Agregar una división */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <form onSubmit={crearDivision} style={{ display: 'flex', gap: 6 }}>
          <input
            className="form-input"
            placeholder="Nueva división (ej: 1ro A, Sala Roja)"
            value={nuevaDiv}
            onChange={(e) => setNuevaDiv(e.target.value)}
            style={{ maxWidth: 260, fontSize: '0.85rem', padding: '6px 10px' }}
            required
          />
          <button className="btn btn-ghost btn-sm" type="submit" disabled={saving}>
            + Agregar
          </button>
        </form>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={() => setShowBulk((s) => !s)}
          style={{ whiteSpace: 'nowrap' }}
        >
          {showBulk ? 'Cerrar carga rápida' : '⚡ Carga rápida'}
        </button>
      </div>

      {/* Panel de carga rápida */}
      {showBulk && (
        <div style={{
          marginTop: 12,
          background: 'var(--surface-2)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          padding: '16px',
        }}>
          {/* Tabs modo */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 14, background: 'var(--bg)', borderRadius: 999, padding: 3, width: 'fit-content' }}>
            {[['lista', 'Lista libre'], ['grados', 'Grados × sufijos']].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setBulkMode(val)}
                style={{
                  padding: '5px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.82rem',
                  background: bulkMode === val ? 'var(--brand)' : 'transparent',
                  color: bulkMode === val ? 'var(--cream)' : 'var(--muted)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {bulkMode === 'lista' ? (
            <div className="form-group">
              <label style={{ fontSize: '0.82rem' }}>Un nombre por línea</label>
              <textarea
                className="form-textarea"
                placeholder={'Sala Roja\nSala Azul\nSala Verde'}
                value={bulkLista}
                onChange={(e) => setBulkLista(e.target.value)}
                style={{ minHeight: 100, fontSize: '0.85rem' }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.82rem' }}>Desde</label>
                  <select
                    className="form-select"
                    value={gradoDesde}
                    onChange={(e) => setGradoDesde(Number(e.target.value))}
                    style={{ padding: '6px 10px', fontSize: '0.85rem', width: 90 }}
                  >
                    {GRADO_LABELS.map((g, i) => <option key={i} value={i}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.82rem' }}>Hasta</label>
                  <select
                    className="form-select"
                    value={gradoHasta}
                    onChange={(e) => setGradoHasta(Number(e.target.value))}
                    style={{ padding: '6px 10px', fontSize: '0.85rem', width: 90 }}
                  >
                    {GRADO_LABELS.map((g, i) => <option key={i} value={i}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: '0.82rem' }}>Sufijos (separados por coma)</label>
                  <input
                    className="form-input"
                    placeholder="Arrayán, Jacarandá, Ceibo  ó  A, B"
                    value={sufijos}
                    onChange={(e) => setSufijos(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 6 }}>
                Se van a crear <strong>{preview.length}</strong> divisiones:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {preview.map((n, i) => (
                  <span key={i} style={{
                    background: 'var(--surface)', border: '1px solid var(--line)',
                    borderRadius: 999, padding: '2px 10px', fontSize: '0.8rem',
                  }}>
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={crearBulk}
            disabled={savingBulk || preview.length === 0}
            style={{ marginTop: 12 }}
          >
            {savingBulk ? 'Creando...' : `Crear ${preview.length} divisiones`}
          </button>
        </div>
      )}
    </div>
  )
}

function generateSafe(fn) {
  try { return fn() } catch { return [] }
}

const thStyle = {
  textAlign: 'left',
  padding: '7px 12px',
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  fontWeight: 700,
  borderBottom: '1px solid var(--line)',
}

const tdStyle = {
  padding: '8px 12px',
  verticalAlign: 'middle',
}
