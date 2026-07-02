import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

// GET /api/admin/instituciones — con niveles y divisiones
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('instituciones')
    .select(`
      id, nombre, activo,
      niveles (
        id, nombre, activo,
        divisiones ( id, nombre, activo )
      )
    `)
    .order('nombre')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ instituciones: data })
}

// POST /api/admin/instituciones
export async function POST(request) {
  const { nombre } = await request.json()
  if (!nombre?.trim()) {
    return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('instituciones')
    .insert({ nombre: nombre.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ institucion: data }, { status: 201 })
}
