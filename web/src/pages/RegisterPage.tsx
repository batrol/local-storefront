import { useAuth } from '@/auth/AuthContext'
import { Button, Card, ErrorText, Field } from '@/components/ui'
import { firstError } from '@/lib/apiClient'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Informe seu nome'),
  shop_name: z.string().min(1, 'Informe o nome da loja'),
  phone: z.string().optional(),
  email: z.email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo de 8 caracteres'),
})
type Values = z.infer<typeof schema>

export function RegisterPage() {
  const { user, register: signUp } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) })

  if (user) return <Navigate to="/painel" replace />

  const onSubmit = handleSubmit(async (v) => {
    setError('')
    try {
      await signUp(v)
      navigate('/painel')
    } catch (e) {
      setError(firstError(e))
    }
  })

  const err = formState.errors
  return (
    <main className="mx-auto mt-10 max-w-sm p-4">
      <Card>
        <h1 className="mb-4 text-xl font-bold">Criar sua loja</h1>
        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          <Field label="Seu nome" error={err.name?.message} {...register('name')} />
          <Field label="Nome da loja" error={err.shop_name?.message} {...register('shop_name')} />
          <Field label="Telefone / WhatsApp" type="tel" error={err.phone?.message} {...register('phone')} />
          <Field label="E-mail" type="email" autoComplete="email" error={err.email?.message} {...register('email')} />
          <Field label="Senha" type="password" autoComplete="new-password" error={err.password?.message} {...register('password')} />
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={formState.isSubmitting} className="w-full">Criar loja</Button>
        </form>
        <p className="mt-4 text-sm">
          Já tem conta? <Link className="font-medium text-emerald-800 underline" to="/login">Entrar</Link>
        </p>
      </Card>
    </main>
  )
}
