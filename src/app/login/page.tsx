'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { authenticate } from '@/app/lib/actions';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at top left, hsl(var(--bg-start)), hsl(var(--bg-end)))',
            backgroundAttachment: 'fixed',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: 'var(--radius)',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid hsl(var(--border))'
            }}>
                <div style={{ marginBottom: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '1rem' }}>
                        <Image
                            src="/images/pmn-logo.png"
                            alt="Logo PMN"
                            fill
                            style={{ objectFit: 'contain' }}
                            priority
                        />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'hsl(var(--foreground))', marginBottom: '0.5rem' }}>
                        PMN DATAHUB
                    </h1>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', maxWidth: '80%' }}>
                        Plateforme nationale de consultation des données artisans
                    </p>
                </div>

                <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
                            Email
                        </label>
                        <input
                            name="username"
                            type="email"
                            required
                            placeholder="exemple@gmail.com"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius)',
                                border: '1px solid hsl(var(--input))',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
                            Mot de passe
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    paddingRight: '2.5rem',
                                    borderRadius: 'var(--radius)',
                                    border: '1px solid hsl(var(--input))',
                                    fontSize: '1rem'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#6b7280', // Hardcoded gray to ensure visibility
                                    padding: '0.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10, // Ensure it's on top
                                }}
                                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="btn btn-primary"
                        style={{ marginTop: '1rem', width: '100%' }}
                    >
                        {isPending ? 'Connexion...' : 'Se connecter'}
                    </button>

                    {errorMessage && (
                        <div style={{ color: 'hsl(var(--destructive))', fontSize: '0.9rem', textAlign: 'center' }}>
                            {errorMessage}
                        </div>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <Link href="/register" style={{ fontSize: '0.85rem', color: 'hsl(var(--primary))', textDecoration: 'none' }}>
                            Créer un compte agent
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
