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
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
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
            const isAdminUser = role === 'admin' || role === 'super_admin';

            if (isAdminUser) {
                // Admin on Login Pages -> Redirect to Admin Area
                if (isLoginPage || isAdminLoginPage) {
                    return Response.redirect(new URL('/admin', nextUrl));
                }
                // Admin is allowed on Dashboard? 
                // User asked for "Separation clear".
                // If strictness is required, we could redirect /dashboard to /admin.
                // For now, we allow access but prevent accidental redirection TO dashboard from login.
                return true;
            }

            // User Logic (Non-Admin)
            if (!isAdminUser) {
                // User on Admin Pages -> Redirect to Dashboard
                // EXCEPTION: Allow access to Admin Login to enable "Account Switching"
                if (isOnAdmin) {
                    if (isAdminLoginPage) {
                        return true;
                    }
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
                // User on Login Page -> Redirect to Dashboard
                if (isLoginPage) {
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
                return true;
            }

            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.status = user.status;
                token.nom = (user as any).nom;
                token.prenom = (user as any).prenom;
                token.chambre = (user as any).chambre;
                token.fonction = (user as any).fonction;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role as string;
                session.user.status = token.status as string;
                (session.user as any).nom = token.nom;
                (session.user as any).prenom = token.prenom;
                (session.user as any).chambre = token.chambre;
                (session.user as any).fonction = token.fonction;
            }
            return session;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
