import { useAuth } from '@/auth/AuthContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Button, Card, ErrorText, Field } from '@/components/ui'
import { firstError } from '@/lib/apiClient'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router'
import { z } from 'zod'

export function LoginPage() {
  const { t } = useTranslation()
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const schema = useMemo(
    () =>
      z.object({
        email: z.email(t('auth.invalidEmail')),
        password: z.string().min(1, t('auth.enterPassword')),
      }),
    [t],
  )
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

  if (user) return <Navigate to="/dashboard" replace />

  const onSubmit = handleSubmit(async (v) => {
    setError('')
    try {
      await login(v.email, v.password)
      navigate('/dashboard')
    } catch (e) {
      setError(firstError(e))
    }
  })

  return (
    <main className="mx-auto mt-16 max-w-sm p-4">
      <div className="mb-2 flex justify-end"><LanguageSwitcher /></div>
      <Card>
        <h1 className="mb-4 text-xl font-bold">{t('auth.signIn')}</h1>
        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          <Field label={t('auth.email')} type="email" autoComplete="email" error={formState.errors.email?.message} {...register('email')} />
          <Field label={t('auth.password')} type="password" autoComplete="current-password" error={formState.errors.password?.message} {...register('password')} />
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={formState.isSubmitting} className="w-full">{t('auth.signIn')}</Button>
        </form>
        <p className="mt-4 text-sm">
          {t('auth.noShop')} <Link className="font-medium text-emerald-800 underline" to="/register">{t('auth.signUp')}</Link>
        </p>
      </Card>
    </main>
  )
}
