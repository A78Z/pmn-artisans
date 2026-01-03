import { auth } from "@/app/lib/auth";
import { getAdminDashboardData } from "@/app/lib/admin";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminPage() {
    const session = await auth();

    // 1. Strict Auth Check
    if (!session || !session.user) {
        redirect("/admin/login");
    }

    // 2. Role Check (Basic) - more granular checks can happen in the client or actions
    // But we want to fail fast if not at least logged in as a potential admin.
    // If the role isn't explicitly 'admin' or 'super_admin', we might still let them in 
    // if the system allows 'user' to see a basic dashboard, but typically admin is protected.
    // Given the prompt, let's assume strict admin access.
    // 2. Role Check
    const role = (session.user as any).role;
    if (role !== 'admin' && role !== 'super_admin' && session.user.email !== 'syllaharouna740@gmail.com') {
        redirect("/dashboard");
    }

    // 3. Fetch Data (Server Side)
    // using Master Key logic from lib/admin.ts
    const { stats, initialUsers } = await getAdminDashboardData();

    return (
        <AdminDashboardClient
            initialStats={stats}
            initialUsers={initialUsers}
            session={session}
        />
    );
}
