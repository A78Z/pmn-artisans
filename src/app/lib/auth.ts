import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '@/auth.config';
import Parse, { ensureParseInitialized } from './parse';

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
                isAdminLogin: { label: "Is Admin", type: "text" }
            },
            authorize: async (credentials) => {
                if (!credentials?.username || !credentials?.password) return null;

                console.log("[Auth] Attempting login for:", credentials.username);

                try {
                    // 1. Ensure Parse is initialized
                    // Using centralized helper to ensure Master Key is used if available (Server Side)
                    await ensureParseInitialized();

                    // 2. Attempt Login
                    const user = await Parse.User.logIn(
                        credentials.username as string,
                        credentials.password as string
                    );

                    console.log("[Auth] Login successful for:", user.id);

                    // Force fetch to ensure we have all fields (nom, prenom)
                    try {
                        await user.fetch({ useMasterKey: true });
                        console.log("Fetched user data:", user.get("nom"), user.get("prenom"));
                    } catch (fetchError) {
                        console.error("[Auth] Failed to fetch fresh user data:", fetchError);
                    }

                    if (user) {
                        // 3. Status Check
                        const status = user.get("status");
                        if (status === 'pending') {
                            console.warn("[Auth] Account pending:", user.id);
                            throw new Error("Compte en attente de validation.");
                        }

                        // 4. Admin Role Check
                        if (credentials.isAdminLogin === 'true') {
                            const role = user.get("role");
                            console.log("[Auth] Checking Admin Role:", role);
                            // Case insensitive check just in case
                            const validRoles = ['admin', 'super_admin', 'SUPER_ADMIN'];
                            if (!role || !validRoles.includes(role)) {
                                throw new Error("Accès réservé aux administrateurs.");
                            }
                        }

                        // 5. Return Serializable Object
                        return {
                            id: user.id,
                            name: user.get("username"), // Keep email as name for compat
                            email: user.get("email"),
                            role: user.get("role"),
                            status: user.get("status"),
                            nom: user.get("nom") || "",
                            prenom: user.get("prenom") || "",
                            chambre: user.get("chambreName") || "",
                            fonction: user.get("fonction") || "",
                            sessionToken: user.getSessionToken(), // Important: Pass token for Server Actions
                        };
                    }
                } catch (error: any) {
                    console.error("[Auth] Login Exception:", error);

                    // Normalize Parse Errors
                    // Code 101 = Invalid username/password
                    if (error.code === 101) {
                        return null;
                    }

                    // Allow our custom errors to pass through
                    if (error instanceof Error) {
                        throw error;
                    }

                    // Fallback for unknown objects
                    throw new Error(error.message || "Echec de l'authentification.");
                }
                return null;
            },
        }),
    ],
});
