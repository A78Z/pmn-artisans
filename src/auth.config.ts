import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const role = auth?.user?.role as string | undefined;

            const isOnAdmin = nextUrl.pathname.startsWith('/admin');
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname === '/'; // Include root if needed
            const isLoginPage = nextUrl.pathname === '/login';
            const isAdminLoginPage = nextUrl.pathname === '/admin/login';

            // 1. Not Logged In
            if (!isLoggedIn) {
                if (isOnAdmin && !isAdminLoginPage) {
                    return Response.redirect(new URL('/admin/login', nextUrl));
                }
                if (isOnDashboard) {
                    return Response.redirect(new URL('/login', nextUrl));
                }
                return true;
            }

            // 2. Logged In - Strict Role Check
            // Normalize role just in case
            const isAdminUser = role === 'admin' || role === 'super_admin' || role === 'Admin' || role === 'SuperAdmin';

            if (isAdminUser) {
                // Admin Restriction: Cannot be on User Login or User Dashboard
                if (isLoginPage || isOnDashboard || isAdminLoginPage) {
                    return Response.redirect(new URL('/admin', nextUrl));
                }
                return true;
            }

            // 3. User Logic (Non-Admin)
            if (!isAdminUser) {
                // User Restriction: Cannot be on Admin Pages
                if (isOnAdmin) {
                    // Exception: Maybe they want to login as admin? Allow Admin Login Page.
                    if (isAdminLoginPage) return true;
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
                // User Restriction: Cannot be on User Login Page (already logged in)
                if (isLoginPage) {
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
                return true;
            }

            return true;
        },
        async jwt({ token, user, trigger, session }) {
            // Initial sign in
            if (user) {
                console.log("[JWT] Initial sign in for user:", user.id);
                token.role = user.role;
                token.status = user.status;
                token.nom = (user as any).nom;
                token.prenom = (user as any).prenom;
                token.chambre = (user as any).chambre;
                token.fonction = (user as any).fonction;
                token.sessionToken = (user as any).sessionToken;
            }

            // Update session trigger
            if (trigger === "update" && session) {
                console.log("[JWT] Session update triggered");
                return { ...token, ...session.user };
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user && token) {
                session.user.role = token.role as string;
                session.user.status = token.status as string;
                (session.user as any).nom = token.nom;
                (session.user as any).prenom = token.prenom;
                (session.user as any).chambre = token.chambre;
                (session.user as any).fonction = token.fonction;
                (session.user as any).sessionToken = token.sessionToken;
            }
            return session;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
