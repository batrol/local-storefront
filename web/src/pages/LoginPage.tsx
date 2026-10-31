import { useAuth } from '@/auth/AuthContext'
import { Button, Card, ErrorText, Field } from '@/components/ui'
import { firstError } from '@/lib/apiClient'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router'
import { z } from 'zod'

const schema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
})
type Values = z.infer<typeof schema>

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) })

  if (user) return <Navigate to="/painel" replace />

  const onSubmit = handleSubmit(async (v) => {
    setError('')
    try {
      await login(v.email, v.password)
      navigate('/painel')
    } catch (e) {
      setError(firstError(e))
    }
  })

  return (
    <main className="mx-auto mt-16 max-w-sm p-4">
      <Card>
        <h1 className="mb-4 text-xl font-bold">Entrar</h1>
        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          <Field label="E-mail" type="email" autoComplete="email" error={formState.errors.email?.message} {...register('email')} />
          <Field label="Senha" type="password" autoComplete="current-password" error={formState.errors.password?.message} {...register('password')} />
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={formState.isSubmitting} className="w-full">Entrar</Button>
        </form>
        <p className="mt-4 text-sm">
          Ainda não tem loja? <Link className="font-medium text-emerald-800 underline" to="/cadastro">Cadastre-se</Link>
        </p>
      </Card>
    </main>
  )
}
