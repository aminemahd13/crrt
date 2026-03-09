import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
        const isLoginPage = req.nextUrl.pathname === "/admin/login";
        const isApiAdmin = req.nextUrl.pathname.startsWith("/api/admin");

        // Allow login page without auth
        if (isLoginPage) {
            // If already logged in, redirect to admin
            if (token) {
                return NextResponse.redirect(new URL("/admin", req.url));
            }
            return NextResponse.next();
        }

        // Protect admin routes
        if (isAdminRoute || isApiAdmin) {
            if (!token) {
                return NextResponse.redirect(new URL("/admin/login", req.url));
            }

            // Check role
            const role = token.role as string;
            if (!["admin", "editor"].includes(role)) {
                return NextResponse.redirect(new URL("/admin/login", req.url));
            }
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Allow login page and public routes without token
                if (req.nextUrl.pathname === "/admin/login") return true;
                if (!req.nextUrl.pathname.startsWith("/admin") && !req.nextUrl.pathname.startsWith("/api/admin")) return true;
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
};
