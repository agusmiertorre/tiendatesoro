import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export async function GET() {
  return NextResponse.json({ ok: true })
}

export async function POST(request) {
  // Validar firma de MercadoPago
  const secret = process.env.MP_WEBHOOK_SECRET
  if (secret) {
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    const { searchParams } = new URL(request.url)
    const dataId = searchParams.get('data.id')

    if (xSignature) {
      const parts = Object.fromEntries(xSignature.split(',').map((p) => p.split('=')))
      const ts = parts['ts']
      const v1 = parts['v1']
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
      const expected = createHmac('sha256', secret).update(manifest).digest('hex')

      if (expected !== v1) {
        return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
      }
    }
  }

  const body = await request.json().catch(() => null)

  if (body?.type !== 'payment' || !body?.data?.id) {
    return NextResponse.json({ ok: true })
  }

  const paymentId = String(body.data.id)

  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })

  if (!mpRes.ok) {
    console.error('MP webhook: no se pudo verificar el pago', paymentId)
    return NextResponse.json({ error: 'No se pudo verificar el pago' }, { status: 500 })
  }

  const payment = await mpRes.json()
  const orderId = payment.external_reference
  const status = payment.status

  if (!orderId) return NextResponse.json({ ok: true })

  const estadoOrden =
    status === 'approved' ? 'approved' :
    status === 'rejected' || status === 'cancelled' ? 'rejected' :
    'pending'

  await supabaseAdmin
    .from('orders')
    .update({ estado: estadoOrden, mp_payment_id: paymentId })
    .eq('id', orderId)

  return NextResponse.json({ ok: true })
}
