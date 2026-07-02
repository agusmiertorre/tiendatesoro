'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminShell from '../../../../components/AdminShell'

const EMPTY_FORM = {
  nombre: '',
  descripcion: '',
  precio: '',
  stock: '0',
  stock_infinito: false,
  categoria: '',
  activo: true,
  imagen_url: '',
}

export default function NuevoProducto() {
  const router = useRouter()
  const [form, setForm] = useState(EMPTY_FORM)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/products/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) {
      setForm((p) => ({ ...p, imagen_url: data.url }))
    } else {
      setError(data.error || 'Error subiendo la imagen')
    }
    setUploading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        precio: Number(form.precio),
        stock: form.stock_infinito ? 0 : Number(form.stock),
      }),
    })

    const data = await res.json()
    if (data.error) {
      setError(data.error)
      setSaving(false)
    } else {
      router.push('/admin/productos')
    }
  }

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Nuevo producto</h1>
        <Link href="/admin/productos" className="btn btn-ghost">
          ← Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-group">
          <label htmlFor="nombre">Nombre *</label>
          <input
            id="nombre"
            className="form-input"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="ej: Pack escolar 10×15"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            className="form-textarea"
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            placeholder="Breve descripción del producto..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="precio">Precio (ARS) *</label>
          <input
            id="precio"
            className="form-input"
            name="precio"
            type="number"
            min="0"
            step="0.01"
            value={form.precio}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            id="stock_infinito"
            name="stock_infinito"
            checked={form.stock_infinito}
            onChange={handleChange}
            style={{ width: 18, height: 18, accentColor: 'var(--brand)', flexShrink: 0 }}
          />
          <label htmlFor="stock_infinito" style={{ cursor: 'pointer' }}>
            Stock infinito (no limitar cantidad)
          </label>
        </div>

        {!form.stock_infinito && (
          <div className="form-group">
            <label htmlFor="stock">Stock disponible</label>
            <input
              id="stock"
              className="form-input"
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={handleChange}
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="categoria">Categoría</label>
          <input
            id="categoria"
            className="form-input"
            name="categoria"
            value={form.categoria}
            onChange={handleChange}
            placeholder="ej: Packs, Ampliaciones, Individuales..."
          />
        </div>

        <div className="form-group">
          <label>Imagen del producto</label>
          {form.imagen_url && (
            <img
              src={form.imagen_url}
              alt="Vista previa"
              style={{
                width: 140,
                height: 105,
                objectFit: 'cover',
                borderRadius: 'var(--radius)',
                marginBottom: 8,
                border: '1px solid var(--line)',
              }}
            />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            disabled={uploading}
            style={{ fontSize: '0.9rem' }}
          />
          {uploading && <p className="form-hint">Subiendo imagen...</p>}
          <p className="form-hint">JPG, PNG o WebP — máx. 5 MB</p>
        </div>

        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            id="activo"
            name="activo"
            checked={form.activo}
            onChange={handleChange}
            style={{ width: 18, height: 18, accentColor: 'var(--brand)', flexShrink: 0 }}
          />
          <label htmlFor="activo" style={{ cursor: 'pointer' }}>
            Activo (visible en la tienda)
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={saving || uploading}
          >
            {saving ? 'Guardando...' : 'Crear producto'}
          </button>
          <Link href="/admin/productos" className="btn btn-ghost">
            Cancelar
          </Link>
        </div>
      </form>
    </AdminShell>
  )
}
