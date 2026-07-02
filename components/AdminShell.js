'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AdminShell({ children }) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          Tesoro <span className="gold">Estudio</span>
        </div>
        <nav className="admin-nav">
          <Link
            href="/admin/productos"
            className={pathname.startsWith('/admin/productos') ? 'active' : ''}
          >
            Productos
          </Link>
          <Link
            href="/admin/pedidos"
            className={pathname === '/admin/pedidos' ? 'active' : ''}
          >
            Pedidos
          </Link>
          <Link
            href="/admin/instituciones"
            className={pathname.startsWith('/admin/instituciones') ? 'active' : ''}
          >
            Instituciones
          </Link>
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <span className="admin-header-title">Panel de administración</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  )
}
