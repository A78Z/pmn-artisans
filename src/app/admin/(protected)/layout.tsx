import { auth } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Administration - PMN DATAHUB',
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // 1. Check Auth
    if (!session || !session.user) {
        redirect('/admin/login');
    }

    // 2. Check Role
    const role = (session.user as any).role;
    const isAdmin = role === 'admin' || role === 'super_admin' || session.user.email === 'syllaharouna740@gmail.com';

    if (!isAdmin) {
        // If not admin, redirect to dashboard
        redirect('/dashboard');
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-start)' }}>
            {children}
        </div>
    );
}
