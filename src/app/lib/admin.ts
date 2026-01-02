import Parse, { ensureParseInitialized } from "@/app/lib/parse";

export async function getAdminDashboardData() {
    try {
        await ensureParseInitialized();

        const stats = {
            totalUsers: 0,
            pendingValidation: 0,
            onlineUsers: 0
        };

        // 1. Total Users Count
        const totalQuery = new Parse.Query(Parse.User);
        stats.totalUsers = await totalQuery.count({ useMasterKey: true });

        // 2. Pending Validation Count
        const pendingQuery = new Parse.Query(Parse.User);
        pendingQuery.equalTo("status", "pending");
        stats.pendingValidation = await pendingQuery.count({ useMasterKey: true });

        // 3. Online Users (Active in last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const onlineQuery = new Parse.Query(Parse.User);
        onlineQuery.greaterThan("lastActiveAt", fiveMinutesAgo);
        stats.onlineUsers = await onlineQuery.count({ useMasterKey: true });

        // 4. Fetch Initial Users
        const initialQuery = new Parse.Query(Parse.User);
        initialQuery.equalTo("status", "pending");
        initialQuery.descending("createdAt");
        initialQuery.limit(50);

        const results = await initialQuery.find({ useMasterKey: true });

        const users = results.map(u => ({
            id: u.id,
            email: u.get("email"),
            nom: u.get("nom"),
            prenom: u.get("prenom"),
            role: u.get("role"),
            status: u.get("status"),
            chambre: u.get("chambre"),
            fonction: u.get("fonction"),
            createdAt: u.get("createdAt") ? u.get("createdAt").toISOString() : null
        }));

        // CRITICAL: Ensure robust serialization to prevent "An unexpected response" error
        // mimicking a Cloud Function response.
        return JSON.parse(JSON.stringify({
            stats,
            initialUsers: users
        }));

    } catch (e: any) {
        console.error("[Admin] Server-Side Data Fetch Error:", e);
        // Return valid empty structure to prevent Client crash
        return {
            stats: { totalUsers: 0, pendingValidation: 0, onlineUsers: 0 },
            initialUsers: []
        };
    }
}
