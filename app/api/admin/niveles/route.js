import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

// POST /api/admin/niveles
export async function POST(request) {
  const { institucion_id, nombre } = await request.json()

  if (!institucion_id || !nombre?.trim()) {
    return NextResponse.json(
      { error: 'institucion_id y nombre son obligatorios' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('niveles')
    .insert({ institucion_id, nombre: nombre.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ nivel: data }, { status: 201 })
}
