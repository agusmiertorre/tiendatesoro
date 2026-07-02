import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

// GET /api/products
// Usa el cliente público (anon key). Como RLS solo deja leer productos
// con activo = true, no hace falta filtrar acá — pero lo dejamos explícito
// igual para que quede claro.
export async function GET() {
  const { data, error } = await supabase
    .from('products')
    .select('id, nombre, descripcion, precio, stock, imagen_url, categoria')
    .eq('activo', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error trayendo productos:', error);
    return NextResponse.json(
      { error: 'No se pudieron obtener los productos' },
      { status: 500 }
    );
  }

  return NextResponse.json({ products: data });
}
