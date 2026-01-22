import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

// Routes publiques (accessibles sans authentification)
const publicRoutes = ["/login"];

// Routes API à ignorer
const apiRoutes = ["/api", "/uploads"];

// Routes par rôle
const roleRoutes: Record<Role, string[]> = {
  DIRECTEUR: ["/dashboard", "/departments", "/users", "/requests", "/settings", "/reports", "/internal-requests"],
  ACHAT: ["/dashboard", "/requests", "/reports", "/internal-requests"],
  COMPTABLE: ["/dashboard", "/requests", "/reports"],
  USER: ["/dashboard", "/requests"],
};

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  // console.log("USER",req.auth?.user);
  // console.log("MIDDLEWARE CALLED");
  // console.log("PATH:", req.nextUrl.pathname);
  // console.log("AUTH:", req.auth);
    
  const userRole = req.auth?.user?.role as Role | undefined;

  const pathname = nextUrl.pathname;

  // Ignorer les routes API (NextAuth, etc.)
  const isApiRoute = apiRoutes.some((route) => pathname.startsWith(route));
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Vérifier si c'est une route publique
  const isPublicRoute = publicRoutes.includes(pathname);

  // CORRECTION 1 : Si connecté et sur /login, rediriger vers dashboard (empêche retour arrière)
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // CORRECTION 2 : Si route publique et non connecté, laisser passer
  if (isPublicRoute && !isLoggedIn) {
    return NextResponse.next();
  }

  // CORRECTION 3 : Si non connecté et route protégée, rediriger vers login
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // CORRECTION 4 : Rediriger la racine vers le dashboard
  if (pathname === "/" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // CORRECTION 5 : Vérifier les permissions par rôle
  if (isLoggedIn && userRole) {
    const allowedRoutes = roleRoutes[userRole];
    const hasAccess = allowedRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (!hasAccess) {
      // Rediriger vers dashboard si pas d'accès
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|uploads).*)",
    // "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

// src/middleware.ts

// import { auth } from "@/lib/auth";
// import { NextResponse } from "next/server";
// import { Role } from "@prisma/client";

// // Routes par rôle
// const roleRoutes: Record<Role, string[]> = {
//   DIRECTEUR: ["/dashboard", "/departments", "/users", "/requests", "/settings", "/reports"],
//   ACHAT: ["/dashboard", "/requests", "/reports"],
//   COMPTABLE: ["/dashboard", "/requests", "/reports"],
//   USER: ["/dashboard", "/requests"],
// };

// export default auth((req) => {
//   console.log("🔍 MIDDLEWARE CALLED");
//   console.log("📍 PATH:", req.nextUrl.pathname);
//   console.log("👤 AUTH:", req.auth?.user);
  
//   const { nextUrl } = req;
//   const pathname = nextUrl.pathname;
//   const isLoggedIn = !!req.auth;
//   const userRole = req.auth?.user?.role as Role | undefined;

//   // Ignorer les routes API
//   if (pathname.startsWith("/api")) {
//     console.log("✅ API route - Pass through");
//     return NextResponse.next();
//   }

//   // Si sur /login et connecté, rediriger vers dashboard
//   if (pathname === "/login" && isLoggedIn) {
//     console.log("🔄 Logged in user on /login - Redirect to /dashboard");
//     return NextResponse.redirect(new URL("/dashboard", nextUrl));
//   }

//   // Si sur /login et pas connecté, laisser passer
//   if (pathname === "/login" && !isLoggedIn) {
//     console.log("✅ Not logged in on /login - Allow");
//     return NextResponse.next();
//   }

//   // Si pas connecté et pas sur /login, rediriger vers login
//   if (!isLoggedIn) {
//     console.log("🔄 Not logged in - Redirect to /login");
//     const loginUrl = new URL("/login", nextUrl);
//     loginUrl.searchParams.set("callbackUrl", pathname);
//     return NextResponse.redirect(loginUrl);
//   }

//   // Rediriger la racine vers dashboard
//   if (pathname === "/") {
//     console.log("🔄 Root path - Redirect to /dashboard");
//     return NextResponse.redirect(new URL("/dashboard", nextUrl));
//   }

//   // Vérifier les permissions par rôle
//   if (userRole) {
//     const allowedRoutes = roleRoutes[userRole];
//     const hasAccess = allowedRoutes.some(
//       (route) => pathname === route || pathname.startsWith(`${route}/`)
//     );

//     if (!hasAccess) {
//       console.log("❌ Access denied for role:", userRole, "to path:", pathname);
//       return NextResponse.redirect(new URL("/dashboard", nextUrl));
//     }
    
//     console.log("✅ Access granted for role:", userRole);
//   }

//   console.log("✅ Pass through");
//   return NextResponse.next();
// });

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - public files (images, etc.)
//      */
//     "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
//   ],
// };