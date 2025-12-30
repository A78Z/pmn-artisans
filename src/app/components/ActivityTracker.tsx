'use strict';
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { trackActivity } from '@/app/lib/actions';

export default function ActivityTracker() {
    const { data: session } = useSession();
    const pathname = usePathname();

    useEffect(() => {
        if (session?.user?.email) {
            // Track on mount / path change
            trackActivity(session.user.email);

            const interval = setInterval(() => {
                if (session?.user?.email) {
                    trackActivity(session.user.email);
                }
            }, 2 * 60 * 1000);

            return () => clearInterval(interval);
        }
    }, [session, pathname]);

    return null;
}
