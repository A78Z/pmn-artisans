import Parse, { ensureParseInitialized } from "@/app/lib/parse";

export async function getAdminDashboardData() {
    await ensureParseInitialized();

    const stats = {
        totalUsers: 0,
        pendingValidation: 0,
        onlineUsers: 0 // Placeholder, online status is often transient/socket based but we'll try to estimate or keep 0 if no mechanism
    };

    // 1. Total Users Count (excluding admins if needed, but let's count all 'User' objects minus purely system ones if any)
    const totalQuery = new Parse.Query(Parse.User);
    stats.totalUsers = await totalQuery.count({ useMasterKey: true });

    // 2. Pending Validation Count
    const pendingQuery = new Parse.Query(Parse.User);
    pendingQuery.equalTo("status", "pending");
    stats.pendingValidation = await pendingQuery.count({ useMasterKey: true });

    // 3. Online Users - Hard to determine without a heartbeat, but we can check 'updatedAt' recently if we had that logic.
    // For now we will replicate existing logic if it existed, or return 0. 
    // The previous code had a placeholder for this.

    // 4. Fetch Initial Users (Pending by default as that's the most important view)
    const initialQuery = new Parse.Query(Parse.User);
    initialQuery.equalTo("status", "pending");
    initialQuery.descending("createdAt");
    initialQuery.limit(50); // Reasonable initial limit

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

    return {
        stats,
        initialUsers: users
    };
}
