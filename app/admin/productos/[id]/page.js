'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import AdminShell from '../../../../components/AdminShell'

export default function EditarProducto() {
  const router = useRouter()
  const { id } = useParams()
  const [form, setForm] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.product) setForm(data.product)
        else setError(data.error || 'Producto no encontrado')
      })
      .catch(() => setError('Error cargando el producto'))
  }, [id])

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
    if (data.url) setForm((p) => ({ ...p, imagen_url: data.url }))
    else setError(data.error || 'Error subiendo la imagen')
    setUploading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        precio: Number(form.precio),
        stock: Number(form.stock),
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

  if (!form && !error) {
    return <AdminShell><p className="state-msg">Cargando producto...</p></AdminShell>
  }

  if (error && !form) {
    return (
      <AdminShell>
        <p className="form-error">{error}</p>
        <Link href="/admin/productos" className="btn btn-ghost" style={{ marginTop: 16 }}>
          ← Volver a productos
        </Link>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Editar producto</h1>
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
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            className="form-textarea"
            name="descripcion"
            value={form.descripcion || ''}
            onChange={handleChange}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
          <div className="form-group">
            <label htmlFor="stock">Stock</label>
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
        </div>

        <div className="form-group">
          <label htmlFor="categoria">Categoría</label>
          <input
            id="categoria"
            className="form-input"
            name="categoria"
            value={form.categoria || ''}
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
          <p className="form-hint">JPG, PNG o WebP — máx. 5 MB. Subir una nueva reemplaza la actual.</p>
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
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link href="/admin/productos" className="btn btn-ghost">
            Cancelar
          </Link>
        </div>
      </form>
    </AdminShell>
  )
}
