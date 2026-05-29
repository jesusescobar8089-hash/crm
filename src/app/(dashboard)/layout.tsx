'use client'

import { useSyncExternalStore, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import {
  Home,
  Users,
  FileText,
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
  Droplets,
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

const emptySubscribe = () => () => {}

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

const navItems = [
  { title: 'Dashboard', href: '/panel', icon: Home, emoji: '🏠' },
  { title: 'Clientes', href: '/clientes', icon: Users, emoji: '👥' },
  { title: 'Cotizaciones', href: '/cotizaciones', icon: FileText, emoji: '📄' },
  { title: 'Monitoreos', href: '/monitoreos', icon: Wrench, emoji: '🔧' },
  { title: 'Inventario', href: '/inventario', icon: Package, emoji: '📦' },
  { title: 'Finanzas', href: '/finanzas', icon: DollarSign, emoji: '💰' },
  { title: 'Documentos', href: '/documentos', icon: FolderOpen, emoji: '🗂️' },
  { title: 'Tareas', href: '/tareas', icon: CheckSquare, emoji: '✅' },
  { title: 'Bitácora', href: '/bitacora', icon: ClipboardList, emoji: '📋' },
  { title: 'Configuración', href: '/configuracion', icon: Settings, emoji: '⚙️' },
]

function getModuleTitle(pathname: string): string {
  if (pathname === '/panel') return 'Dashboard'
  const item = navItems.find((n) => n.href !== '/panel' && pathname.startsWith(n.href))
  return item?.title ?? 'Dashboard'
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center animate-pulse">
            <Droplets className="w-6 h-6 text-white" />
          </div>
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
  const initials = user?.nombre
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'U'

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="offcanvas">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-sm">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                AgroEve
              </span>
              <span className="text-[10px] text-muted-foreground leading-none">
                Gestión Interna
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegación</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
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
                        tooltip={`${item.emoji} ${item.title}`}
                        onClick={() => router.push(item.href)}
                      >
                        <button className="flex items-center gap-3 w-full" type="button">
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
          <div className="flex items-center gap-3 px-2 py-1">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.nombre}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6 sticky top-0 z-30">
          <SidebarTrigger className="-ml-1" />

          <Separator orientation="vertical" className="h-6" />

          <h1 className="text-base font-semibold">{moduleTitle}</h1>

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
                <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 text-[10px] font-medium">
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
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
