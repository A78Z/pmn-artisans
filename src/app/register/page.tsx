'use client';

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { registerChambre } from '@/app/lib/actions';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { getFilterOptions } from '@/app/lib/actions';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="btn btn-primary"
            style={{
                width: '100%',
                marginTop: '1.5rem',
                justifyContent: 'center',
                backgroundColor: 'hsl(var(--primary))',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                cursor: pending ? 'not-allowed' : 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}
        >
            {pending ? (
                <>
                    <Loader2 className="animate-spin" size={20} />
                    Traitement en cours...
                </>
            ) : (
                'Créer le compte'
            )}
        </button>
    );
}

export default function RegisterPage() {
    const [state, formAction] = useActionState(registerChambre, null);

    // Dropdown Data
    const [regions, setRegions] = useState<string[]>([]);
    const [departements, setDepartements] = useState<string[]>([]);

    // Selections
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedDepartement, setSelectedDepartement] = useState('');

    // Toggle Visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Fetch Regions on mount
    useEffect(() => {
        async function loadRegions() {
            const res = await getFilterOptions({});
            if (res.success && res.data) {
                setRegions(res.data.regions || []);
            }
        }
        loadRegions();
    }, []);

    // Fetch Departements when Region changes
    useEffect(() => {
        async function loadDepts() {
            if (!selectedRegion) {
                setDepartements([]);
                return;
            }
            const res = await getFilterOptions({ region: selectedRegion });
            if (res.success && res.data) {
                setDepartements(res.data.departements || []);
            }
        }
        loadDepts();
    }, [selectedRegion]);

    return (
        <main style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)',
            padding: '2rem'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                    marginBottom: '1.5rem',
                    position: 'relative',
                    width: '100px',
                    height: '100px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                    <Image
                        src="/pmn-logo.png"
                        alt="PMN Logo"
                        width={70}
                        height={70}
                        style={{ objectFit: 'contain' }}
                        priority
                    />
                </div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'hsl(var(--primary))' }}>
                    Créer un compte – Chambre de Métiers
                </h1>
                <p style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Accès officiel à la plateforme PMN DATAHUB
                </p>
            </div>

            {/* Form Card */}
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(12px)',
                padding: '2.5rem',
                borderRadius: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
                maxWidth: '600px',
                width: '100%'
            }}>
                {state?.success ? (
                    <div style={{ textAlign: 'center', color: 'hsl(var(--primary))' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Demande envoyée !</h2>
                        <p style={{ marginBottom: '2rem', color: 'hsl(var(--foreground))' }}>
                            {state.message}
                        </p>
                        <Link href="/" className="btn btn-outline" style={{ display: 'inline-block', padding: '0.5rem 1rem', border: '1px solid hsl(var(--primary))', borderRadius: '0.5rem', color: 'hsl(var(--primary))', textDecoration: 'none' }}>
                            Retour à l'accueil
                        </Link>
                    </div>
                ) : (
                    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* 1. Informations Institutionnelles */}
                        <section>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'hsl(var(--foreground))', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
                                🏛️ Informations institutionnelles
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                <div>
                                    <label className="label">Nom de la Chambre de Métiers *</label>
                                    <input type="text" name="chambreName" required className="input" placeholder="ex: Chambre de Métiers de Dakar"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid hsl(var(--input))' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="label">Région *</label>
                                        <select
                                            name="region"
                                            required
                                            className="input"
                                            value={selectedRegion}
                                            onChange={(e) => {
                                                setSelectedRegion(e.target.value);
                                                setSelectedDepartement(''); // Reset department on region change
                                            }}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid hsl(var(--input))' }}
                                        >
                                            <option value="">Sélectionner...</option>
                                            {regions.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Département *</label>
                                        <select
                                            name="departement"
                                            required
                                            className="input"
                                            disabled={!selectedRegion}
                                            value={selectedDepartement}
                                            onChange={(e) => setSelectedDepartement(e.target.value)}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid hsl(var(--input))', backgroundColor: !selectedRegion ? 'hsl(var(--muted))' : 'white' }}
                                        >
                                            <option value="">Sélectionner...</option>
                                            {departements.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. Responsable */}
                        <section>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'hsl(var(--foreground))', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
                                👤 Responsable du compte
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="label">Prénom *</label>
                                    <input type="text" name="prenom" required className="input" placeholder="Prénom"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid hsl(var(--input))' }} />
                                </div>
                                <div>
                                    <label className="label">Nom *</label>
                                    <input type="text" name="nom" required className="input" placeholder="Nom"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid hsl(var(--input))' }} />
                                </div>
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <label className="label">Fonction *</label>
                                <input type="text" name="fonction" required className="input" placeholder="ex: Président, Secrétaire Général..."
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid hsl(var(--input))' }} />
                            </div>
                        </section>

                        {/* 3. Connexion */}
                        <section>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'hsl(var(--foreground))', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
                                📧 Informations de connexion
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                <div>
                                    <label className="label">Email *</label>
                                    <input type="email" name="email" required className="input" placeholder="contact.chambremetiers@..."
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid hsl(var(--input))' }} />
                                </div>
                                <div>
                                    <label className="label">Téléphone *</label>
                                    <input type="tel" name="phone" required className="input" placeholder="+221 ..."
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid hsl(var(--input))' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <label className="label">Mot de passe *</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                required
                                                className="input"
                                                minLength={8}
                                                placeholder="Min. 8 caractères"
                                                style={{ width: '100%', padding: '0.5rem 2.5rem 0.5rem 0.5rem', borderRadius: '0.4rem', border: '1px solid hsl(var(--input))' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{
                                                    position: 'absolute',
                                                    right: '0.5rem',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: 'hsl(var(--muted-foreground))',
                                                    padding: '0'
                                                }}
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <label className="label">Confirmer *</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                name="confirmPassword"
                                                required
                                                className="input"
                                                minLength={8}
                                                placeholder="Répéter le mot de passe"
                                                style={{ width: '100%', padding: '0.5rem 2.5rem 0.5rem 0.5rem', borderRadius: '0.4rem', border: '1px solid hsl(var(--input))' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                style={{
                                                    position: 'absolute',
                                                    right: '0.5rem',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: 'hsl(var(--muted-foreground))',
                                                    padding: '0'
                                                }}
                                            >
                                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                                    Le mot de passe doit contenir au moins 8 caractères.
                                </p>
                            </div>
                        </section>

                        {/* 4. Validation */}
                        <section style={{ backgroundColor: 'hsl(var(--muted))', padding: '1rem', borderRadius: '0.5rem' }}>
                            <label style={{ display: 'flex', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input type="checkbox" required style={{ marginTop: '0.2rem' }} />
                                <span>Je certifie que ces informations sont exactes et officielles.</span>
                            </label>
                            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                Les comptes sont soumis à validation par l’administration PMN.
                            </p>
                        </section>

                        {state?.error && (
                            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.9rem' }}>
                                ⚠️ {state.error}
                            </div>
                        )}

                        <SubmitButton />

                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <Link href="/" style={{ fontSize: '0.9rem', color: 'hsl(var(--primary))', textDecoration: 'none' }}>
                                Déjà un compte ? Se connecter
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </main>
    );
}
