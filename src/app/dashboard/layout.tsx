import Link from "next/link";
import { SignOutButton } from "@/app/ui/sign-out";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>


            {/* MAIN CONTENT */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {children}
            </div>
        </div>
    );
}
