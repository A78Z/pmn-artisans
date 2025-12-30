'use client';

import { useActionState } from 'react';
import { createUser } from '@/app/lib/actions';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
    const [errorMessage, dispatch, isPending] = useActionState(
        async (prevState: string | undefined, formData: FormData) => {
            const result = await createUser(formData);
            if (result.error) {
                return result.error;
            }
            window.location.href = '/login?signup=success';
            return undefined;
        },
        undefined
    );

    return (
        <main style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: 'var(--color-bg-light)'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        Créer un compte
                    </h1>
                    <p style={{ color: 'var(--color-text-light)', marginTop: '0.5rem' }}>
                        PMN DATAHUB
                    </p>
                </div>

                <form action={dispatch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                            Email
                        </label>
                        <input
                            className="input-field"
                            id="email"
                            type="email"
                            name="email"
                            placeholder="votre@email.com"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                            Mot de passe
                        </label>
                        <input
                            className="input-field"
                            id="password"
                            type="password"
                            name="password"
                            placeholder="******"
                            required
                            minLength={6}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    {errorMessage && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem'
                        }}>
                            {errorMessage}
                        </div>
                    )}

                    <button
                        aria-disabled={isPending}
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            fontWeight: 600,
                            cursor: isPending ? 'not-allowed' : 'pointer',
                            opacity: isPending ? 0.7 : 1,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: '1rem'
                        }}
                    >
                        {isPending ? <Loader2 className="animate-spin" size={20} /> : "S'inscrire"}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '0.875rem', marginTop: '1rem' }}>
                        Déjà un compte ? <a href="/login" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Se connecter</a>
                    </p>
                </form>
            </div>
        </main>
    );
}
