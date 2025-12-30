import Link from "next/link";
import Image from "next/image";

export default function Home() {
    return (
        <main style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            padding: '1rem'
        }}>
            <div style={{
                marginBottom: '2rem',
                position: 'relative',
                width: '120px',
                height: '120px',
                backgroundColor: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
                {/* Use public URL directly or import from next/image if configured */}
                <Image
                    src="/pmn-logo.png"
                    alt="PMN Logo"
                    width={80}
                    height={80}
                    style={{ objectFit: 'contain' }}
                    priority
                />
            </div>

            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                padding: '2.5rem',
                borderRadius: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 8px 32px rgba(31, 122, 76, 0.05)',
                maxWidth: '400px',
                width: '100%'
            }}>
                <h1 style={{
                    fontSize: '1.75rem',
                    fontWeight: 'bold',
                    color: 'hsl(var(--primary))',
                    marginBottom: '0.5rem'
                }}>
                    PMN DATAHUB
                </h1>

                <p style={{
                    fontSize: '0.9rem',
                    color: 'hsl(var(--muted-foreground))',
                    marginBottom: '2rem',
                    lineHeight: '1.5'
                }}>
                    Plateforme nationale de consultation<br />des données artisans
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Placeholder for real login form later - for now acting as the access portal */}
                    <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'hsl(var(--foreground))', marginBottom: '0.4rem', display: 'block' }}>Email</label>
                        <input
                            type="email"
                            placeholder="exemple@pmn.sn"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.5rem',
                                border: '1px solid hsl(var(--input))',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'hsl(var(--foreground))', marginBottom: '0.4rem', display: 'block' }}>Mot de passe</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.5rem',
                                border: '1px solid hsl(var(--input))',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    <Link href="/dashboard" className="btn btn-primary" style={{ textDecoration: 'none', width: '100%', justifyContent: 'center' }}>
                        Se connecter
                    </Link>

                    <Link href="/register" style={{ fontSize: '0.8rem', color: 'hsl(var(--primary))', marginTop: '1rem', textDecoration: 'none', fontWeight: '500' }}>
                        Créer un compte agent
                    </Link>
                </div>
            </div>
        </main>
    );
}
