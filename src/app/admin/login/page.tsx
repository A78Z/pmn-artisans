'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { authenticateAdmin } from '@/app/lib/actions';
import { Loader2, Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

export default function AdminLoginPage() {
    const [errorMessage, dispatch] = useActionState(authenticateAdmin, undefined);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, #06402B 100%)',
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '3rem',
                borderRadius: '1rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                width: '100%',
                maxWidth: '450px',
                textAlign: 'center'
            }}>
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '80px', height: '80px', position: 'relative' }}>
                        {/* Placeholder for Logo - Assuming standard path or fallback */}
                        {/* Using text fallback if logo not found, but trying standard path */}
                        <div style={{ fontSize: '3rem' }}>🦅</div>
                    </div>
                </div>

                <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'hsl(var(--foreground))', marginBottom: '0.5rem' }}>Espace Administration</h1>
                <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '2rem' }}>PMN Datahub</p>

                <form action={dispatch} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'hsl(var(--foreground))' }}>Email</label>
                        <input
                            name="username"
                            type="email"
                            required
                            placeholder="admin@pmn.sn"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))', fontSize: '1rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'hsl(var(--foreground))' }}>Mot de passe</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="••••••••"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))', fontSize: '1rem', paddingRight: '2.5rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem',
                                    zIndex: 10
                                }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1rem' }}>
                        <LoginButton />
                    </div>

                    {errorMessage && (
                        <div style={{
                            padding: '1rem', borderRadius: '0.5rem',
                            backgroundColor: '#fee2e2', color: '#b91c1c',
                            fontSize: '0.9rem', fontWeight: '500',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}>
                            <Lock size={16} /> {errorMessage}
                        </div>
                    )}
                </form>
            </div>

            <div style={{ position: 'absolute', bottom: '1rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                © 2024 Projet Mobilier National. Tous droits réservés.
            </div>
        </div>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();
    return (
        <button
            disabled={pending}
            type="submit"
            style={{
                width: '100%', padding: '0.875rem', borderRadius: '0.5rem', border: 'none',
                backgroundColor: 'hsl(var(--primary))', color: 'white',
                fontSize: '1rem', fontWeight: '600', cursor: pending ? 'not-allowed' : 'pointer',
                opacity: pending ? 0.8 : 1, transition: 'background-color 0.2s'
            }}
        >
            {pending ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'Se connecter'}
        </button>
    );
}
