import { useTranslation } from 'react-i18next'
import { Navigate, Outlet } from 'react-router'
import { useAuth } from './AuthContext'

export function RequireAuth() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  if (loading) return <p className="p-6 text-slate-500">{t('common.loading')}</p>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
