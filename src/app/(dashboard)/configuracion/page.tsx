'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Sun,
  Moon,
  Lock,
  Building2,
  Database,
  Users,
  Tag,
  Droplets,
} from 'lucide-react'

export default function ConfiguracionPage() {
  const { user } = useAuthStore()
  const { theme, setTheme } = useTheme()

  // Password dialog
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Todos los campos son requeridos')
      return
    }
    if (newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          currentPassword,
          newPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al cambiar la contraseña')
      }

      toast.success('Contraseña actualizada correctamente')
      setPasswordOpen(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cambiar la contraseña')
    } finally {
      setChangingPassword(false)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Configuración</h2>
        <p className="text-muted-foreground text-sm">
          Administra tu perfil y la configuración del sistema
        </p>
      </div>

      {/* Section 1: Mi Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-sky-500" />
            Mi Perfil
          </CardTitle>
          <CardDescription>Información de tu cuenta de usuario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Nombre</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user?.nombre || '—'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Email</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <span className="font-medium text-sm">{user?.email || '—'}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Theme toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-sky-500" />
              ) : (
                <Sun className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className="font-medium text-sm">Tema de la interfaz</p>
                <p className="text-xs text-muted-foreground">
                  {theme === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado'}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={toggleTheme}>
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 mr-2" />
                  Modo claro
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-2" />
                  Modo oscuro
                </>
              )}
            </Button>
          </div>

          <Separator />

          {/* Change password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="font-medium text-sm">Contraseña</p>
                <p className="text-xs text-muted-foreground">
                  Cambia tu contraseña de acceso
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setPasswordOpen(true)}>
              <Lock className="h-4 w-4 mr-2" />
              Cambiar contraseña
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Datos de la Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-sky-500" />
            Datos de la Empresa
          </CardTitle>
          <CardDescription>Información del sistema AgroEve</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Company identity */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-sky-50 to-emerald-50 dark:from-sky-950/30 dark:to-emerald-950/30 border border-sky-100 dark:border-sky-900/30">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-sm shrink-0">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">AgroEve</h3>
                <p className="text-sm text-muted-foreground">Sistema de Gestión Interna</p>
              </div>
            </div>

            <Separator />

            {/* System info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Versión</p>
                  <p className="font-medium text-sm">1.0.0</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Database className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Base de datos</p>
                  <p className="font-medium text-sm">SQLite (local)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Socios</p>
                  <p className="font-medium text-sm">2 usuarios activos</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="font-medium text-sm">Sistema interno</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Ingresa tu contraseña actual y la nueva contraseña
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña actual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleChangePassword()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordOpen(false)
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
