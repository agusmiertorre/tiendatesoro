import { NextResponse } from 'next/server'
import { verifySession } from './lib/session'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // El login (página y API) siempre es accesible
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next()
  }

  const cookie = request.cookies.get('admin_session')
  const authenticated = cookie ? await verifySession(cookie.value) : false

  if (!authenticated) {
    // API routes → 401
    if (pathname.startsWith('/api/admin/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    // Páginas admin → redirigir a login
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
