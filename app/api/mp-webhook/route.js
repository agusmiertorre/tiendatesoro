import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

// MercadoPago envía un GET de validación al registrar el webhook — debe responder 200
export async function GET() {
  return NextResponse.json({ ok: true })
}

// POST /api/mp-webhook — recibe notificaciones de pagos
export async function POST(request) {
  const body = await request.json().catch(() => null)

  // Solo procesamos notificaciones de tipo "payment"
  if (body?.type !== 'payment' || !body?.data?.id) {
    return NextResponse.json({ ok: true })
  }

  const paymentId = String(body.data.id)

  // Verificamos el pago directamente contra la API de MP (no confiamos en el body)
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })

  if (!mpRes.ok) {
    console.error('MP webhook: no se pudo verificar el pago', paymentId)
    return NextResponse.json({ error: 'No se pudo verificar el pago' }, { status: 500 })
  }

  const payment = await mpRes.json()

  // external_reference es el order_id que guardamos al crear la preferencia
  const orderId = payment.external_reference
  const status = payment.status // 'approved' | 'pending' | 'rejected' | 'cancelled' | etc.

  if (!orderId) {
    return NextResponse.json({ ok: true })
  }

  // Mapeamos el estado de MP al estado de la orden
  const estadoOrden =
    status === 'approved' ? 'approved' :
    status === 'rejected' || status === 'cancelled' ? 'rejected' :
    'pending'

  await supabaseAdmin
    .from('orders')
    .update({
      estado: estadoOrden,
      mp_payment_id: paymentId,
    })
    .eq('id', orderId)

  return NextResponse.json({ ok: true })
}
