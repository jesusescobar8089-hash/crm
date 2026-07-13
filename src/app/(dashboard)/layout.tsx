'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import {
  Home,
  Users,
  FileText,
  Receipt,
  Wrench,
  Package,
  DollarSign,
  FolderOpen,
  CheckSquare,
  ClipboardList,
  Settings,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function useMounted() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}

const navItems = [
  { title: 'Panel', href: '/panel', icon: Home },
  { title: 'Clientes', href: '/clientes', icon: Users },
  { title: 'Cotizaciones', href: '/cotizaciones', icon: FileText },
  { title: 'Facturas', href: '/facturas', icon: Receipt },
  { title: 'Monitoreos', href: '/monitoreos', icon: Wrench },
  { title: 'Inventario', href: '/inventario', icon: Package },
  { title: 'Finanzas', href: '/finanzas', icon: DollarSign },
  { title: 'Documentos', href: '/documentos', icon: FolderOpen },
  { title: 'Tareas', href: '/tareas', icon: CheckSquare },
  { title: 'Bitácora', href: '/bitacora', icon: ClipboardList },
  { title: 'Configuración', href: '/configuracion', icon: Settings },
]

function getModuleTitle(pathname: string): string {
  if (pathname === '/panel') return 'Panel'
  const item = navItems.find((n) => n.href !== '/panel' && pathname.startsWith(n.href))
  return item?.title ?? 'Dashboard'
}

function getBreadcrumb(pathname: string, moduleTitle: string) {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length <= 1) return null

  return (
    <nav aria-label="Ruta actual" className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
      <span>Inicio</span>
      <ChevronRight className="h-3.5 w-3.5" />
      <span>{moduleTitle}</span>
      {segments.length > 1 && (
        <>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">Detalle</span>
        </>
      )}
    </nav>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  const handleAuthRedirect = useCallback(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/login')
    }
  }, [mounted, isAuthenticated, router])

  useEffect(() => {
    handleAuthRedirect()
  }, [handleAuthRedirect])

  // Apply user theme preference
  useEffect(() => {
    if (user?.tema && mounted) {
      setTheme(user.tema)
    }
  }, [user?.tema, mounted, setTheme])

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <img src="/brand/image2.png" alt="AgroEve" className="h-12 w-auto animate-pulse" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    toast.success('Sesión cerrada')
    router.replace('/login')
  }

  const moduleTitle = getModuleTitle(pathname)
  const breadcrumb = getBreadcrumb(pathname, moduleTitle)
  const initials = user?.nombre
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'U'

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="offcanvas" className="border-r bg-sidebar">
        <SidebarHeader className="p-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 min-w-0 items-center">
              <img src="/brand/image2.png" alt="AgroEve" className="h-9 w-auto max-w-36 object-contain" />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-[11px] leading-none text-muted-foreground">
                Gestión Interna
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent className="px-2 py-2">
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-[11px] font-medium uppercase tracking-normal text-muted-foreground">
              Navegación
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {navItems.map((item) => {
                  const isActive =
                    item.href === '/panel'
                      ? pathname === '/panel'
                      : pathname.startsWith(item.href)

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        onClick={() => router.push(item.href)}
                      >
                        <button className="flex w-full items-center gap-3" type="button">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarSeparator />
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="relative">
              <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-muted text-xs font-medium text-foreground">
                {initials}
              </AvatarFallback>
              </Avatar>
              <span className="absolute -right-0.5 -bottom-0.5 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-sidebar bg-emerald-500" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.nombre}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
          <SidebarTrigger className="-ml-1" />

          <Separator orientation="vertical" className="h-6" />

          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">{moduleTitle}</h1>
            {breadcrumb}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="sr-only">Cambiar tema</span>
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex h-9 items-center gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-muted text-[10px] font-medium text-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">
                    {user?.nombre?.split(' ')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.nombre}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 bg-background p-4 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
