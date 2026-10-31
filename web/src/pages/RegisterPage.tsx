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

export function RegisterPage() {
  const { t } = useTranslation()
  const { user, register: signUp } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('auth.enterName')),
        shop_name: z.string().min(1, t('auth.enterShopName')),
        phone: z.string().optional(),
        email: z.email(t('auth.invalidEmail')),
        password: z.string().min(8, t('auth.passwordMin')),
      }),
    [t],
  )
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

  if (user) return <Navigate to="/dashboard" replace />

  const onSubmit = handleSubmit(async (v) => {
    setError('')
    try {
      await signUp(v)
      navigate('/dashboard')
    } catch (e) {
      setError(firstError(e))
    }
  })

  const err = formState.errors
  return (
    <main className="mx-auto mt-10 max-w-sm p-4">
      <div className="mb-2 flex justify-end"><LanguageSwitcher /></div>
      <Card>
        <h1 className="mb-4 text-xl font-bold">{t('auth.createShop')}</h1>
        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          <Field label={t('auth.yourName')} error={err.name?.message} {...register('name')} />
          <Field label={t('auth.shopName')} error={err.shop_name?.message} {...register('shop_name')} />
          <Field label={t('auth.phone')} type="tel" error={err.phone?.message} {...register('phone')} />
          <Field label={t('auth.email')} type="email" autoComplete="email" error={err.email?.message} {...register('email')} />
          <Field label={t('auth.password')} type="password" autoComplete="new-password" error={err.password?.message} {...register('password')} />
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={formState.isSubmitting} className="w-full">{t('auth.createShopButton')}</Button>
        </form>
        <p className="mt-4 text-sm">
          {t('auth.haveAccount')} <Link className="font-medium text-emerald-800 underline" to="/login">{t('auth.signIn')}</Link>
        </p>
      </Card>
    </main>
  )
}
