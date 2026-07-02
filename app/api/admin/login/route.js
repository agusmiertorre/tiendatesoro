import { NextResponse } from 'next/server'
import { createSession } from '../../../../lib/session'

export async function POST(request) {
  const { user, password } = await request.json()

  const validUser = process.env.ADMIN_USER
  const validPassword = process.env.ADMIN_PASSWORD

  if (!validUser || !validPassword) {
    return NextResponse.json(
      { error: 'Credenciales de admin no configuradas en el servidor' },
      { status: 500 }
    )
  }

  if (user !== validUser || password !== validPassword) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
  }

  const token = await createSession(user)

  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 8 * 60 * 60, // 8 horas en segundos
  })

  return response
}
