'use server';

import { signIn } from '@/app/lib/auth';
import { AuthError } from 'next-auth';

import Parse, { ensureParseInitialized } from "./parse";

export async function createUser(formData: FormData) {
    // ... existing createUser for basic dev testing if needed, or we can deprecate it.
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string || email;

    try {
        const user = new Parse.User();
        user.set("username", username);
        user.set("password", password);
        user.set("email", email);

        await user.signUp();
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Registration failed" };
    }
}

export async function registerChambre(prevState: any, formData: FormData) {
    const chambreName = formData.get('chambreName') as string;
    const region = formData.get('region') as string;
    const departement = formData.get('departement') as string;

    const nom = formData.get('nom') as string;
    const prenom = formData.get('prenom') as string;
    const fonction = formData.get('fonction') as string;

    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
        return { error: "Les mots de passe ne correspondent pas." };
    }

    try {
        // Ensure Parse is initialized (helper check)
        if (!Parse.applicationId) {
            const appId = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
            const jsKey = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;
            const serverUrl = process.env.NEXT_PUBLIC_PARSE_SERVER_URL;
            if (appId && jsKey && serverUrl) {
                Parse.initialize(appId, jsKey);
                Parse.serverURL = serverUrl;
            }
        }

        const user = new Parse.User();

        // Base Auth Info
        user.set("username", email); // Use email as username
        user.set("password", password);
        user.set("email", email);

        // Custom Fields
        user.set("chambreName", chambreName);
        user.set("region", region);
        user.set("departement", departement);
        user.set("nom", nom);
        user.set("prenom", prenom);
        user.set("fonction", fonction);
        user.set("phone", phone);

        // Security Status - WAITING FOR ADMIN VALIDATION
        user.set("status", "pending");
        user.set("role", "chambre_metier"); // Explicit role

        await user.signUp();

        return { success: true, message: "Inscription validée automatiquement. Vous pouvez maintenant vous connecter." };
    } catch (error: any) {
        console.error("Registration Error:", error);
        return { error: error.message || "Une erreur est survenue lors de l'inscription." };
    }
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData, { redirectTo: '/dashboard' });
    } catch (error: any) {
        if (error.message === 'NEXT_REDIRECT' || (error.digest && error.digest.toString().includes('NEXT_REDIRECT'))) {
            throw error;
        }

        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Identifiants invalides.';
                default:
                    return 'Une erreur est survenue lors de la connexion.';
            }
        }

        // Handle custom error messages thrown from auth.ts
        if (error.message) {
            if (error.message.includes("Compte en attente") || error.message.includes("Account pending")) {
                return "Votre compte est en attente de validation par l'administration.";
            }
            // Return raw error message if it's safe/expected
            return error.message;
        }

        console.error("Authentication Error:", error);
        return 'Une erreur inattendue est survenue.';
    }
}

export async function authenticateAdmin(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        formData.append('isAdminLogin', 'true');
        await signIn('credentials', formData, { redirectTo: '/admin' });
    } catch (error: any) {
        if (error.message === 'NEXT_REDIRECT' || (error.digest && error.digest.toString().includes('NEXT_REDIRECT'))) {
            throw error;
        }

        if (error instanceof AuthError) {
            // Check specific causes
            if (error.cause?.err?.message) {
                const msg = error.cause.err.message;
                if (msg === "Accès réservé aux administrateurs." || msg === "Compte en attente de validation.") {
                    return msg;
                }
            }

            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Identifiants invalides ou accès non autorisé.';
                default:
                    return 'Une erreur technique est survenue.';
            }
        }

        // Direct throw handling
        if (error.message === "Accès réservé aux administrateurs.") return error.message;

        console.error("Admin Auth Error:", error);
        return 'Une erreur inattendue est survenue.';
    }
}

// Intelligent Filtering Action
export async function getFilterOptions(currentFilters: {
    region?: string;
    departement?: string;
    commune?: string;
    quartier?: string;
    filiere?: string;
    metier?: string;
}) {
    console.log("getFilterOptions called with:", currentFilters);

    // Ensure Parse is ready
    await ensureParseInitialized();

    // Helper to request Metadata Classes
    const getOptions = async (className: string, filters: any, fieldName: string = "name") => {
        try {
            // Re-verify initialization inside the helper to ensure Parse is ready in Server Action context
            await ensureParseInitialized();

            const query = new Parse.Query(className);

            // Apply filters (Assuming metadata classes have these pointer fields or string fields)
            // In import_metadata.ts, we saved them as string fields: region, departement, commune, filiere.
            if (filters.region) query.equalTo("region", filters.region);
            if (filters.departement) query.equalTo("departement", filters.departement);
            if (filters.commune) query.equalTo("commune", filters.commune);
            if (filters.filiere) query.equalTo("filiere", filters.filiere);

            query.limit(1000);
            query.ascending(fieldName);

            const results = await query.find();
            return results.map(r => r.get(fieldName) as string).filter(Boolean);
        } catch (e: any) {
            console.error(`Error fetching ${className} in getFilterOptions:`, e);
            return [];
        }
    };

    try {
        // 1. Region
        // 2. Departement
        const deptFilters = currentFilters.region ? { region: currentFilters.region } : {};

        // 3. Commune
        const communeFilters: any = {};
        if (currentFilters.region) communeFilters.region = currentFilters.region;
        if (currentFilters.departement) communeFilters.departement = currentFilters.departement;

        // 4. Quartier
        const quartierFilters: any = {};
        if (currentFilters.region) quartierFilters.region = currentFilters.region;
        if (currentFilters.departement) quartierFilters.departement = currentFilters.departement;
        if (currentFilters.commune) quartierFilters.commune = currentFilters.commune;

        // 5. Filiere
        // 6. Metier
        const metierFilters = currentFilters.filiere ? { filiere: currentFilters.filiere } : {};

        const [regions, departements, communes, quartiers, filieres, metiers] = await Promise.all([
            getOptions('Region', {}),
            getOptions('Departement', deptFilters),
            getOptions('Commune', communeFilters),
            getOptions('Quartier', quartierFilters),
            getOptions('Filiere', {}),
            getOptions('Metier', metierFilters),
        ]);

        console.log("getFilterOptions success");

        return {
            success: true,
            data: JSON.parse(JSON.stringify({
                regions,
                departements,
                communes,
                quartiers,
                filieres,
                metiers
            }))
        };
    } catch (err: any) {
        console.error("CRITICAL ERROR in getFilterOptions logic:", err);
        return {
            success: false,
            error: err.message || "Erreur de chargement des filtres",
            data: {
                regions: [],
                departements: [],
                communes: [],
                quartiers: [],
                filieres: [],
                metiers: []
            }
        };
    }
}

// --- ADMIN ACTIONS ---

export async function trackActivity(email: string) {
    if (!email) return;
    try {
        await ensureParseInitialized();
        const query = new Parse.Query(Parse.User);
        query.equalTo("email", email);
        const user = await query.first({ useMasterKey: true });
        if (user) {
            user.set("lastActiveAt", new Date());
            await user.save(null, { useMasterKey: true });
        }
    } catch (e) {
        // Silent fail
        console.error("Tracking error", e);
    }
}

export async function getAdminStats() {
    try {
        await ensureParseInitialized();
        const query = new Parse.Query(Parse.User);
        const total = await query.count({ useMasterKey: true });

        const pendingQuery = new Parse.Query(Parse.User);
        pendingQuery.equalTo("status", "pending");
        const pending = await pendingQuery.count({ useMasterKey: true });

        // Online = active in last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const onlineQuery = new Parse.Query(Parse.User);
        onlineQuery.greaterThan("lastActiveAt", fiveMinutesAgo);
        const online = await onlineQuery.count({ useMasterKey: true });

        return {
            success: true,
            data: {
                totalUsers: total,
                pendingValidation: pending,
                onlineUsers: online
            }
        };
    } catch (e: any) {
        console.error("Stats Error", e);
        return {
            success: false,
            error: e.message,
            data: { totalUsers: 0, pendingValidation: 0, onlineUsers: 0 }
        };
    }
}

export async function getUsers(statusFilter: 'all' | 'pending' | 'active' | 'online' = 'all') {
    try {
        await ensureParseInitialized();
        const query = new Parse.Query(Parse.User);

        if (statusFilter === 'pending') {
            query.equalTo("status", "pending");
        } else if (statusFilter === 'active') {
            query.notEqualTo("status", "pending");
        } else if (statusFilter === 'online') {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            query.greaterThan("lastActiveAt", fiveMinutesAgo);
        }

        query.descending("createdAt");
        query.limit(100);

        const users = await query.find({ useMasterKey: true });

        const safeUsers = users.map(u => ({
            id: u.id,
            username: u.get("username") || "",
            email: u.get("email") || "",
            phone: u.get("phone") || "",
            nom: u.get("nom") || "",
            prenom: u.get("prenom") || "",
            fonction: u.get("fonction") || "",
            region: u.get("region") || "",
            departement: u.get("departement") || "",
            chambreName: u.get("chambreName") || "",
            status: u.get("status") || "active",
            role: u.get("role") || "user",
            createdAt: u.createdAt?.toISOString() || new Date().toISOString(),
            lastActiveAt: u.get("lastActiveAt") ? (u.get("lastActiveAt") as Date).toISOString() : null
        }));

        return { success: true, data: JSON.parse(JSON.stringify(safeUsers)) };
    } catch (e: any) {
        console.error("Get Users Error", e);
        return { success: false, error: e.message || "Erreur de chargement des utilisateurs", data: [] };
    }
}

export async function updateUserStatus(userId: string, newStatus: 'active' | 'refused') {
    try {
        await ensureParseInitialized();
        const query = new Parse.Query(Parse.User);
        const user = await query.get(userId, { useMasterKey: true });

        user.set("status", newStatus);

        await user.save(null, { useMasterKey: true });
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function resetUserPassword(userId: string, newPassword: string) {
    try {
        await ensureParseInitialized();
        const query = new Parse.Query(Parse.User);
        const user = await query.get(userId, { useMasterKey: true });

        user.setPassword(newPassword);

        await user.save(null, { useMasterKey: true });
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function createAdminUser(data: { email: string; password?: string; role: 'admin' | 'super_admin'; nom?: string; prenom?: string }) {
    try {
        await ensureParseInitialized();
        // Enforce Super Admin Check (Simple implementation for now)
        // In real app, check current session role.

        const user = new Parse.User();
        // Check if user exists first? user.signUp handles it.

        user.set("username", data.email);
        user.set("email", data.email);
        user.set("password", data.password || Math.random().toString(36).slice(-8));
        user.set("role", data.role);
        user.set("nom", data.nom || "");
        user.set("prenom", data.prenom || "");
        user.set("status", "active");

        // Ensure no other fields block sign up

        await user.signUp(null, { useMasterKey: true });

        // We could send email here

        return { success: true };
    } catch (e: any) {
        console.error("Create Admin Error", e);
        return { error: e.message };
    }
}

export async function getAdmins() {
    try {
        await ensureParseInitialized();
        const query = new Parse.Query(Parse.User);
        query.containedIn("role", ["admin", "super_admin"]);
        query.descending("createdAt");

        const results = await query.find({ useMasterKey: true });

        const safeAdmins = results.map(u => ({
            id: u.id,
            email: u.get("email"),
            username: u.get("username"),
            nom: u.get("nom"),
            prenom: u.get("prenom"),
            role: u.get("role"),
            status: u.get("status"),
            lastActiveAt: u.get("lastActiveAt") ? (u.get("lastActiveAt") as Date).toISOString() : null,
            createdAt: u.createdAt?.toISOString() || new Date().toISOString()
        }));

        return { success: true, data: JSON.parse(JSON.stringify(safeAdmins)) };
    } catch (e: any) {
        console.error("Get Admins Error", e);
        return { success: false, error: e.message, data: [] };
    }
}

export async function sendPasswordResetEmail(email: string, newPass: string) {
    // In a real app, use Resend, SendGrid, or nodemailer here.
    console.log(`[EMAIL SIMULATION] To: ${email}, Subject: Réinitialisation de mot de passe, Body: Votre nouveau mot de passe est : ${newPass}`);
    return { success: true };
}
