import { NextResponse } from 'next/server';

// Este endpoint todavía NO consulta la base de datos (eso lo hacemos en el Paso 2,
// cuando creemos la tabla "products"). Por ahora solo confirma que las variables
// de entorno de Supabase están cargadas correctamente.
export async function GET() {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  const allOk = hasUrl && hasAnonKey && hasServiceKey;

  return NextResponse.json({
    status: allOk ? 'ok' : 'faltan variables de entorno',
    checks: {
      NEXT_PUBLIC_SUPABASE_URL: hasUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnonKey,
      SUPABASE_SERVICE_ROLE_KEY: hasServiceKey,
    },
  });
}
