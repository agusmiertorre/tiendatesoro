import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

// GET /api/admin/orders — lista todos los pedidos con sus items
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id, nombre, apellido, dni, institucion, grado_anio,
      alumno_nombre, alumno_apellido, total, estado,
      mp_payment_id, created_at,
      order_items (
        cantidad, precio_unitario,
        product:product_id ( nombre )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders: data })
}
