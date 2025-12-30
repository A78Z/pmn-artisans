'use client';

import { SessionProvider } from 'next-auth/react';
import ActivityTracker from '@/app/components/ActivityTracker';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ActivityTracker />
            {children}
        </SessionProvider>
    );
}
