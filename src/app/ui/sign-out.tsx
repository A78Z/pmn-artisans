'use client';
import { signOut } from 'next-auth/react';

export function SignOutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
                background: 'none',
                border: '1px solid hsl(var(--border))',
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontSize: '0.8rem'
            }}
        >
            Déconnexion
        </button>
    )
}
