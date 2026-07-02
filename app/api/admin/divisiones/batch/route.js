import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'

// POST /api/admin/divisiones/batch — crea múltiples divisiones de una vez
export async function POST(request) {
  const { nivel_id, nombres } = await request.json()

  if (!nivel_id || !Array.isArray(nombres) || nombres.length === 0) {
    return NextResponse.json({ error: 'nivel_id y nombres son obligatorios' }, { status: 400 })
  }

  const rows = nombres
    .map((n) => n.trim())
    .filter(Boolean)
    .map((nombre) => ({ nivel_id, nombre }))

  const { data, error } = await supabaseAdmin
    .from('divisiones')
    .insert(rows)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ divisiones: data, count: data.length }, { status: 201 })
}
