import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

// GET /api/instituciones — lista pública con niveles y divisiones activas
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('instituciones')
    .select(`
      id, nombre,
      niveles (
        id, nombre,
        divisiones ( id, nombre )
      )
    `)
    .eq('activo', true)
    .eq('niveles.activo', true)
    .eq('niveles.divisiones.activo', true)
    .order('nombre')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ instituciones: data })
}
