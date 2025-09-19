import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/about', '/services', '/contact']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Dashboard routes that require authentication
  const dashboardRoutes = ['/admin-dashboard', '/cleaner-dashboard', '/homeowner-dashboard']
  const isDashboardRoute = dashboardRoutes.some(route => pathname.startsWith(route))

  // For now, let client-side auth handle redirects
  // This middleware will be enhanced later for server-side session management
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
