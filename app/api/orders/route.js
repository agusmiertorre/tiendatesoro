import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
})

const REQUIRED_BUYER = [
  'nombre', 'apellido', 'dni',
  'institucion', 'alumno_nombre', 'alumno_apellido',
]

// POST /api/orders
// Recibe { buyer, items: [{ product_id, cantidad }] }
// Recalcula el total contra precios reales, valida stock,
// crea la orden en Supabase y la preferencia en Mercado Pago.
export async function POST(request) {
  const body = await request.json()
  const { buyer, items } = body

  // --- Validaciones básicas ---
  for (const field of REQUIRED_BUYER) {
    if (!buyer?.[field]?.toString().trim()) {
      return NextResponse.json(
        { error: `El campo "${field}" es obligatorio` },
        { status: 400 }
      )
    }
  }

  if (!items?.length) {
    return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 })
  }

  // --- Traer precios reales desde la DB ---
  const productIds = [...new Set(items.map((i) => i.product_id))]
  const { data: products, error: prodError } = await supabaseAdmin
    .from('products')
    .select('id, nombre, precio, stock, activo')
    .in('id', productIds)

  if (prodError) {
    return NextResponse.json({ error: 'Error consultando productos' }, { status: 500 })
  }

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]))

  // --- Validar productos y stock ---
  for (const item of items) {
    const p = productMap[item.product_id]
    if (!p) {
      return NextResponse.json(
        { error: `Producto no encontrado: ${item.product_id}` },
        { status: 400 }
      )
    }
    if (!p.activo) {
      return NextResponse.json(
        { error: `"${p.nombre}" ya no está disponible` },
        { status: 400 }
      )
    }
    if (!p.stock_infinito && p.stock < item.cantidad) {
      return NextResponse.json(
        { error: `Stock insuficiente para "${p.nombre}" (disponible: ${p.stock})` },
        { status: 400 }
      )
    }
  }

  // --- Calcular total con precios reales ---
  const total = items.reduce(
    (sum, item) => sum + productMap[item.product_id].precio * item.cantidad,
    0
  )

  // --- Insertar orden ---
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      nombre: buyer.nombre.trim(),
      apellido: buyer.apellido.trim(),
      dni: buyer.dni.trim(),
      institucion: buyer.institucion.trim(),
      grado_anio: buyer.grado_anio?.trim() || null,
      alumno_nombre: buyer.alumno_nombre.trim(),
      alumno_apellido: buyer.alumno_apellido.trim(),
      total,
      estado: 'pending',
    })
    .select()
    .single()

  if (orderError) {
    console.error('Error insertando orden:', orderError)
    return NextResponse.json({ error: 'Error creando el pedido' }, { status: 500 })
  }

  // --- Insertar items ---
  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        cantidad: item.cantidad,
        precio_unitario: productMap[item.product_id].precio,
      }))
    )

  if (itemsError) {
    console.error('Error insertando order_items:', itemsError)
    await supabaseAdmin.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: 'Error guardando los items del pedido' }, { status: 500 })
  }

  // --- Crear preferencia de Mercado Pago ---
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  // MP_SANDBOX=false solo en producción con credenciales reales
  const isSandbox = process.env.MP_SANDBOX !== 'false'

  let preference
  try {
    const mpPreference = new Preference(mpClient)
    preference = await mpPreference.create({
      body: {
        items: items.map((item) => ({
          id: item.product_id,
          title: productMap[item.product_id].nombre,
          quantity: Number(item.cantidad),
          unit_price: Number(productMap[item.product_id].precio),
          currency_id: 'ARS',
        })),
        payer: {
          name: buyer.nombre,
          surname: buyer.apellido,
        },
        external_reference: order.id,
        back_urls: {
          success: `${baseUrl}/gracias?status=approved`,
          failure: `${baseUrl}/gracias?status=failure`,
          pending: `${baseUrl}/gracias?status=pending`,
        },
        ...(baseUrl && !baseUrl.includes('localhost') && { auto_return: 'approved' }),
        notification_url: `${baseUrl}/api/mp-webhook`,
      },
    })
  } catch (err) {
    console.error('Error creando preferencia MP:', err)
    // No borramos la orden — queda en pending, se puede reintentar
    return NextResponse.json(
      { error: 'Error al iniciar el pago. Intentá de nuevo.' },
      { status: 500 }
    )
  }

  // --- Guardar preference_id en la orden ---
  await supabaseAdmin
    .from('orders')
    .update({ mp_preference_id: preference.id })
    .eq('id', order.id)

  const initPoint = isSandbox
    ? preference.sandbox_init_point
    : preference.init_point

  return NextResponse.json({ order_id: order.id, init_point: initPoint })
}
