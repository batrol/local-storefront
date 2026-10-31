import { useAuth } from '@/auth/AuthContext'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router'
import { LanguageSwitcher } from './LanguageSwitcher'
import { GhostButton } from './ui'

const link = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-emerald-100 text-emerald-900' : 'text-slate-600 hover:bg-slate-100'}`

export function AdminLayout() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const shopUrl = `${window.location.origin}/shop/${user?.shop.slug}`

  return (
    <div className="mx-auto max-w-5xl p-4">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-lg font-bold">{user?.shop.name}</h1>
        <nav className="flex gap-1">
          <NavLink to="/dashboard/products" className={link}>{t('layout.products')}</NavLink>
          <NavLink to="/dashboard/orders" className={link}>{t('layout.orders')}</NavLink>
        </nav>
        <LanguageSwitcher />
        <GhostButton onClick={() => void logout()}>{t('auth.signOut')}</GhostButton>
      </header>
      <p className="mb-4 text-sm text-slate-600">
        {t('layout.shopLink')} <a className="font-medium text-emerald-800 underline" href={shopUrl}>{shopUrl}</a>
      </p>
      <Outlet />
    </div>
  )
}
