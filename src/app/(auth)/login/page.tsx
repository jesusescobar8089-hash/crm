'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Droplets, Mail, Lock, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center gap-10 lg:grid-cols-[1fr_420px]">
        <section className="hidden lg:block">
          <div className="max-w-xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Gestión operativa privada
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-balance">
                Control interno claro para clientes, inventario y operaciones.
              </h1>
              <p className="max-w-lg text-base leading-7 text-muted-foreground">
                AgroEve centraliza la actividad comercial y técnica para que cada socio vea qué requiere atención sin ruido.
              </p>
            </div>
            <div className="grid max-w-lg grid-cols-3 gap-3 text-sm">
              {['Clientes', 'Monitoreos', 'Finanzas'].map((item) => (
                <div key={item} className="rounded-lg border bg-card p-4">
                  <p className="font-medium">{item}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Seguimiento diario</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Card className="w-full border bg-card">
          <CardHeader className="space-y-5 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
                <Droplets className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold tracking-tight">
                  AgroEve
                </CardTitle>
                <CardDescription className="mt-1 text-sm">
                  Acceso al sistema interno
                </CardDescription>
              </div>
            </div>
        </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="socio@agroeve.co"
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
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
              className="w-full"
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
                socioA@agroeve.co / agroeve2026<br />
                socioB@agroeve.co / agroeve2026
            </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
