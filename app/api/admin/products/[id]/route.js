import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'

// GET /api/admin/products/[id]
export async function GET(_request, { params }) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ product: data })
}

// PUT /api/admin/products/[id]
export async function PUT(request, { params }) {
  const body = await request.json()
  const { nombre, descripcion, precio, stock, imagen_url, categoria, activo } = body

  const { data, error } = await supabaseAdmin
    .from('products')
    .update({
      nombre,
      descripcion: descripcion ?? '',
      precio: Number(precio),
      stock: Number(stock),
      imagen_url: imagen_url || null,
      categoria: categoria || null,
      activo,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product: data })
}

// DELETE /api/admin/products/[id]
export async function DELETE(_request, { params }) {
  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
