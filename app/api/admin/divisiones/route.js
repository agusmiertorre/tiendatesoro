import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

// POST /api/admin/divisiones
export async function POST(request) {
  const { nivel_id, nombre } = await request.json()

  if (!nivel_id || !nombre?.trim()) {
    return NextResponse.json(
      { error: 'nivel_id y nombre son obligatorios' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('divisiones')
    .insert({ nivel_id, nombre: nombre.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ division: data }, { status: 201 })
}
