'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2, ShieldCheck, Users, Wrench, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { PRIMARY_OPERATOR_EMAIL } from '@/lib/operator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Por favor complete todos los campos')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Error al iniciar sesión')
        return
      }

      login(data.user)
      toast.success(`Bienvenido, ${data.user.nombre}`)
      router.push('/panel')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--accent),transparent_32rem),linear-gradient(180deg,var(--background),var(--muted))] px-4 py-8 text-foreground">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center gap-10 lg:grid-cols-[1fr_420px]">
        <section className="hidden lg:block">
          <div className="max-w-xl space-y-10">
            <div className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Gestión operativa privada
            </div>
            <div className="space-y-5">
              <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-balance">
                Control interno claro para clientes, inventario y operaciones.
              </h1>
              <p className="max-w-lg text-lg leading-8 text-muted-foreground">
                AgroEve centraliza la actividad comercial y técnica para que el socio principal controle lo que requiere atención.
              </p>
            </div>
            <div className="grid max-w-xl grid-cols-3 gap-4 text-sm">
              {[
                { label: 'Clientes', icon: Users, className: 'text-sky-600 bg-sky-100 dark:bg-sky-950/40' },
                { label: 'Monitoreos', icon: Wrench, className: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40' },
                { label: 'Finanzas', icon: DollarSign, className: 'text-violet-600 bg-violet-100 dark:bg-violet-950/40' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${item.className}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <p className="font-semibold">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Seguimiento diario</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Card className="w-full border bg-card shadow-2xl shadow-primary/10">
          <CardHeader className="space-y-6 border-b pb-6">
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 flex-col">
                <img src="/brand/image2.png" alt="AgroEve" className="h-12 w-auto max-w-52 object-contain" />
                <CardDescription className="mt-1 text-sm">
                  Acceso al sistema interno
                </CardDescription>
              </div>
            </div>
        </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="jesusandres-1991@hotmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            <div className="mt-6 rounded-lg border bg-muted/30 p-3">
              <p className="text-xs leading-5 text-muted-foreground">
                <strong className="font-medium text-foreground">Credenciales de prueba</strong><br />
                {PRIMARY_OPERATOR_EMAIL} / Aa123456
            </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
