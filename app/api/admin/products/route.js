import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

// GET /api/admin/products — lista todos los productos (incluyendo inactivos)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ products: data })
}

// POST /api/admin/products — crea un producto nuevo
export async function POST(request) {
  const body = await request.json()
  const { nombre, descripcion, precio, stock, stock_infinito, imagen_url, categoria, activo } = body

  if (!nombre || precio == null) {
    return NextResponse.json({ error: 'nombre y precio son obligatorios' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      nombre,
      descripcion: descripcion || '',
      precio: Number(precio),
      stock: Number(stock ?? 0),
      stock_infinito: stock_infinito === true,
      imagen_url: imagen_url || null,
      categoria: categoria || null,
      activo: activo !== false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product: data }, { status: 201 })
}
