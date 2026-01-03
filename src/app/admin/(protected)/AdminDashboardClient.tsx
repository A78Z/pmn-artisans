'use client';

import { useState, useEffect, useRef } from 'react';
import { getAdminStats, getUsers, updateUserStatus, resetUserPassword, getAdmins, createAdminUser, sendPasswordResetEmail } from '@/app/lib/actions';
import { Loader2, UserCheck, UserX, User, Activity, RefreshCw, Search, Phone, Mail, Key, Shield, Plus, X, Copy, Check, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

interface AdminDashboardClientProps {
    initialStats: {
        totalUsers: number;
        pendingValidation: number;
        onlineUsers: number;
    };
    initialUsers: any[];
    session: any;
}

export default function AdminDashboardClient({ initialStats, initialUsers, session }: AdminDashboardClientProps) {
    const { update } = useSession(); // Keep hook for updates if needed, but we use props for data
    // Initialize with Props
    const [stats, setStats] = useState(initialStats);
    const [activeTab, setActiveTab] = useState<'validation' | 'users' | 'online' | 'admins'>('validation');
    const [data, setData] = useState<any[]>(initialUsers);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [showAddAdminModal, setShowAddAdminModal] = useState(false);

    // Password Reset State
    const [resetUser, setResetUser] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Super Admin Check
    const isSuperAdmin = session?.user?.email === 'syllaharouna740@gmail.com' || (session?.user as any)?.role === 'super_admin' || (session?.user as any)?.role === 'admin';

    // Helper: Retry Wrapper (kept for actions like validate/refuse)
    const fetchWithRetry = async (fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> => {
        try {
            const res = await fn();
            if (res && res.success === false) throw new Error(res.error || "Operation failed");
            return res;
        } catch (err: any) {
            if (retries > 0) {
                await new Promise(res => setTimeout(res, delay));
                return fetchWithRetry(fn, retries - 1, delay);
            } else {
                throw err;
            }
        }
    };

    // Load Data Effect (Only on Tab Change or Refresh - NOT on initial mount if tab matches initial)
    // Actually, we should probably fetch if the tab changes. 
    // And simpler: Initial data corresponds to 'validation' tab (pending users).

    // We need a ref to track if we should fetch. 
    // If activeTab is 'validation' and we just mounted, don't fetch.
    const retryCountRef = useRef(0);
    const isFirstRun = useRef(true);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            // AUTO-RECOVERY: If server returned empty data (potential cold start/timing issue),
            // we force a client-side fetch immediately with a small delay for stability.
            if (initialUsers.length === 0) {
                console.log("Initial data empty - triggering auto-recovery fetch with delay");
                setTimeout(() => {
                    loadData();
                }, 800); // Wait 800ms for session stabilization
            }
            return;
        }
        loadData();
    }, [activeTab]);

    // Interval for Stats (keep this for liveliness)
    useEffect(() => {
        const loadStats = async () => {
            const res = await getAdminStats();
            if (res.success && res.data) setStats(res.data);
        };
        // Auto-refresh stats if they look broken (all zeros) with delay
        if (stats.totalUsers === 0 && stats.pendingValidation === 0) {
            setTimeout(() => {
                loadStats();
            }, 800);
        }
        const interval = setInterval(loadStats, 60000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // 1. Always fetch stats (counters)
            const statsRes = await getAdminStats();
            if (statsRes.success && statsRes.data) {
                setStats(statsRes.data);
            }

            // 2. Determine Fetch Strategy
            let res;
            if (activeTab === 'admins') {
                res = await fetchWithRetry(() => getAdmins());
            } else {
                let filter: 'pending' | 'all' | 'online' = 'all';
                if (activeTab === 'validation') filter = 'pending';
                if (activeTab === 'online') filter = 'online';

                res = await getUsers(filter);
            }

            // 3. Handle Response
            if (res.success && res.data) {
                setData(res.data);
                retryCountRef.current = 0; // Success -> Reset retry
            } else {
                const err = res.error || "Erreur de chargement";

                // RETRY LOGIC for "Unexpected response"
                if ((typeof err === 'string' && err.includes("unexpected response")) || !res.success) {
                    if (retryCountRef.current < 2) {
                        console.log(`Auto-Retrying data load (${retryCountRef.current + 1}/2)...`);
                        retryCountRef.current += 1;
                        setTimeout(() => loadData(), 1200);
                        return;
                    }
                }
                setError(err);
            }
        } catch (e: any) {
            console.error("Load Data Exception:", e);
            const msg = e.message || "Impossible de charger les données.";

            // RETRY LOGIC for Exceptions
            if (msg.includes("unexpected response") && retryCountRef.current < 2) {
                console.log(`Auto-Retrying exception (${retryCountRef.current + 1}/2)...`);
                retryCountRef.current += 1;
                setTimeout(() => loadData(), 1200);
                return;
            }

            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async (userId: string) => {
        // Auto-execution: No confirmation
        const res = await updateUserStatus(userId, 'active');
        if (res.success) {
            // alert("Compte validé !");
            loadData();
            const newStats = await getAdminStats();
            if (newStats.success && newStats.data) {
                setStats(newStats.data);
            }
        } else {
            console.error("Erreur: " + res.error);
        }
    };

    const handleRefuse = async (userId: string) => {
        // Auto-execution: No confirmation
        const res = await updateUserStatus(userId, 'refused');
        if (res.success) {
            // alert("Compte refusé.");
            loadData();
            const newStats = await getAdminStats();
            if (newStats.success && newStats.data) {
                setStats(newStats.data);
            }
        }
    };

    // New Handler opens Modal
    const handleOpenResetModal = (user: any) => {
        setResetUser(user);
    };

    const handleCreateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const nom = formData.get('nom') as string;
        const role = formData.get('role') as 'admin' | 'super_admin';
        const password = formData.get('password') as string;

        if (!email || !role) {
            alert("Veuillez remplir les champs obligatoires.");
            return;
        }

        const res = await createAdminUser({ email, nom, role, password });
        if (res.success) {
            // alert(`L'administrateur ${email} a été créé avec succès.`);
            setShowAddAdminModal(false);
            loadData();
        } else {
            alert("Erreur: " + res.error);
        }
    };

    // Filter
    const filteredData = data.filter(u =>
        u.nom?.toLowerCase().includes(search.toLowerCase()) ||
        u.prenom?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.chambreName?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            {/* MATCHING DASHBOARD HEADER STYLE */}
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'hsl(var(--foreground))', marginBottom: '0.5rem' }}>
                        Administration
                    </h1>
                    <p style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Gérez les accès et suivez l'activité de la plateforme.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {/* Manual Refresh Button */}
                    <button
                        onClick={() => loadData()}
                        title="Actualiser les données"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: 'white', border: '1px solid hsl(var(--border))',
                            color: 'hsl(var(--muted-foreground))',
                            width: '40px', borderRadius: '1rem', cursor: 'pointer',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        }}
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>

                    <div style={{
                        backgroundColor: 'white', padding: '1rem', borderRadius: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        minWidth: '150px'
                    }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                            En Attente
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#eab308' }}>
                            {stats.pendingValidation}
                        </div>
                    </div>
                    <div style={{
                        backgroundColor: 'white', padding: '1rem', borderRadius: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        minWidth: '150px'
                    }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            En Ligne <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'hsl(var(--primary))' }}>
                            {stats.onlineUsers}
                        </div>
                    </div>

                    <button
                        onClick={() => signOut({ callbackUrl: '/admin/login' })}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            backgroundColor: 'white', border: '1px solid #fee2e2', color: '#dc2626',
                            padding: '0 1rem', borderRadius: '1rem', fontWeight: '600',
                            cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                            transition: 'all 0.2s', maxHeight: '90px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                        <LogOut size={20} />
                        Se déconnecter
                    </button>
                </div>
            </header>
            {/* TABS */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '1rem', overflowX: 'auto' }}>
                <TabButton active={activeTab === 'validation'} onClick={() => setActiveTab('validation')} icon={<UserCheck size={18} />} label="Validations" count={stats.pendingValidation} />
                <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<User size={18} />} label="Utilisateurs" />
                <TabButton active={activeTab === 'online'} onClick={() => setActiveTab('online')} icon={<Activity size={18} />} label="En Ligne" />

                {isSuperAdmin && (
                    <TabButton active={activeTab === 'admins'} onClick={() => setActiveTab('admins')} icon={<Shield size={18} />} label="Équipe Admin" special />
                )}
            </div>

            {/* ACTION BAR (Search / Add) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                    <input
                        type="text"
                        placeholder={activeTab === 'admins' ? "Rechercher un admin..." : "Rechercher un utilisateur..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.8rem', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))', outline: 'none' }}
                    />
                </div>
                {activeTab === 'admins' && (
                    <button
                        onClick={() => setShowAddAdminModal(true)}
                        style={{
                            backgroundColor: 'hsl(var(--primary))', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', border: 'none', cursor: 'pointer'
                        }}
                    >
                        <Plus size={18} /> Ajouter un administrateur
                    </button>
                )}
            </div>

            {/* CONTENT CARD */}
            <div style={{ backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid hsl(var(--border))', padding: '2rem', minHeight: '400px' }}>
                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <Shield size={18} />
                        <strong>Erreur :</strong> {error}
                        <button onClick={() => loadData()} style={{ marginLeft: 'auto', background: 'white', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: '#dc2626' }}>Réessayer</button>
                    </div>
                )}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                        <Loader2 className="animate-spin" size={32} style={{ color: 'hsl(var(--primary))' }} />
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                                <th style={{ padding: '1rem' }}>Identité</th>
                                <th style={{ padding: '1rem' }}>{activeTab === 'admins' ? 'Rôle' : 'Chambre / Région'}</th>
                                <th style={{ padding: '1rem' }}>Contact</th>
                                <th style={{ padding: '1rem' }}>Statut</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--muted-foreground))' }}>Aucun résultat trouvé.</td>
                                </tr>
                            ) : filteredData.map(u => (
                                <tr key={u.id} style={{ backgroundColor: 'hsl(var(--muted))', transition: 'transform 0.1s' }}>
                                    <td style={{ padding: '1rem', borderTopLeftRadius: '0.5rem', borderBottomLeftRadius: '0.5rem' }}>
                                        <div style={{ fontWeight: '600', color: 'hsl(var(--foreground))' }}>{u.nom || u.username} {u.prenom}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>{u.fonction || "Admin"}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {activeTab === 'admins' ? (
                                            <span style={{
                                                backgroundColor: u.role === 'super_admin' ? '#7c3aed' : 'hsl(var(--primary))',
                                                color: 'white', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '700'
                                            }}>
                                                {u.role === 'super_admin' ? 'SUPER ADMIN' : 'ADMINISTRATEUR'}
                                            </span>
                                        ) : (
                                            <>
                                                <div style={{ fontWeight: '500' }}>{u.chambreName}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>{u.region}, {u.departement}</div>
                                            </>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Mail size={14} /> {u.email}</div>
                                        {u.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', marginTop: '0.2rem' }}><Phone size={14} /> {u.phone}</div>}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <StatusBadge status={u.status} />
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', borderTopRightRadius: '0.5rem', borderBottomRightRadius: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            {/* Validation Actions */}
                                            {u.status === 'pending' && (
                                                <>
                                                    <ActionButton onClick={() => handleValidate(u.id)} icon={<UserCheck size={18} />} title="Valider" color="hsl(var(--primary))" whiteIcon />
                                                    <ActionButton onClick={() => handleRefuse(u.id)} icon={<UserX size={18} />} title="Refuser" color="#ef4444" whiteIcon />
                                                </>
                                            )}
                                            {/* Admin Actions - MODIFIED to use Modal */}
                                            <ActionButton onClick={() => handleOpenResetModal(u)} icon={<Key size={18} />} title="Aider / Réinitialiser Mot de Passe" />
                                            {u.phone && (
                                                <a href={`tel:${u.phone}`} title="Appeler" style={{ padding: '0.5rem', borderRadius: '50%', border: '1px solid hsl(var(--border))', backgroundColor: 'white', color: 'hsl(var(--foreground))', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px' }}>
                                                    <Phone size={18} />
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ADD ADMIN MODAL */}
            {showAddAdminModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', width: '500px', maxWidth: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Ajouter un administrateur</h2>
                            <button onClick={() => setShowAddAdminModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                        </div>
                        <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
                                <input name="email" type="email" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Nom (Optionnel)</label>
                                <input name="nom" type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Rôle</label>
                                <select name="role" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))' }}>
                                    <option value="admin">Administrateur</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Mot de passe (laisser vide pour générer auto)</label>
                                <input name="password" type="text" placeholder="Généré automatiquement si vide" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))' }} />
                            </div>
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowAddAdminModal(false)} style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', cursor: 'pointer' }}>Annuler</button>
                                <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Créer l'admin</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RESET PASSWORD MODAL (Human Support) */}
            {resetUser && (
                <ResetPasswordModal
                    user={resetUser}
                    onClose={() => setResetUser(null)}
                />
            )}
        </div>
    );
}

// Sub-component for Reset Password Flow
function ResetPasswordModal({ user, onClose }: { user: any, onClose: () => void }) {
    const [mode, setMode] = useState<'auto' | 'manual'>('auto');
    const [manualPass, setManualPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [successPass, setSuccessPass] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const finalPass = mode === 'auto'
                ? Math.random().toString(36).slice(-8).toUpperCase() // Simple readable auto-gen
                : manualPass;

            if (!finalPass) {
                setError("Veuillez saisir un mot de passe.");
                setLoading(false);
                return;
            }

            // 1. Reset
            const res = await resetUserPassword(user.id, finalPass);
            if (!res.success) {
                setError("Erreur: " + res.error);
                setLoading(false);
                return;
            }

            // 2. Send Email (Simulation)
            await sendPasswordResetEmail(user.email, finalPass);

            // 3. Show Success
            setSuccessPass(finalPass);

        } catch (e: any) {
            setError("Erreur inattendue");
        } finally {
            setLoading(false);
        }
    };

    if (successPass) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
            }}>
                <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', width: '500px', maxWidth: '90%', textAlign: 'center' }}>
                    <div style={{ margin: '0 auto 1.5rem', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                        <Check size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669', marginBottom: '1rem' }}>Réinitialisation réussie !</h2>
                    <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '2rem' }}>
                        Le mot de passe de <strong>{user.nom} {user.prenom}</strong> a été mis à jour.
                    </p>

                    <div style={{ backgroundColor: 'hsl(var(--muted))', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
                        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Nouveau mot de passe</p>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'monospace', color: 'hsl(var(--foreground))', letterSpacing: '0.1em' }}>
                            {successPass}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '0.75rem 2rem', borderRadius: '2rem', border: 'none',
                                backgroundColor: 'hsl(var(--primary))', color: 'white', fontWeight: '600', cursor: 'pointer'
                            }}
                        >
                            Terminé
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
        }}>
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', width: '500px', maxWidth: '90%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Shield className="text-primary" /> Aider un utilisateur
                    </h2>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                </div>

                <p style={{ marginBottom: '2rem', color: 'hsl(var(--muted-foreground))' }}>
                    Vous allez réinitialiser le mot de passe de <strong>{user.nom} {user.prenom}</strong> ({user.email}).
                </p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => setMode('auto')}
                        style={{
                            flex: 1, padding: '1rem', borderRadius: '0.5rem', border: mode === 'auto' ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                            backgroundColor: mode === 'auto' ? 'rgba(var(--primary-rgb), 0.05)' : 'white', cursor: 'pointer', textAlign: 'center'
                        }}
                    >
                        <RefreshCw size={24} style={{ marginBottom: '0.5rem', color: mode === 'auto' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} />
                        <div style={{ fontWeight: '600' }}>Générer Auto</div>
                        <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>Sécurisé & Rapide</div>
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        style={{
                            flex: 1, padding: '1rem', borderRadius: '0.5rem', border: mode === 'manual' ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                            backgroundColor: mode === 'manual' ? 'rgba(var(--primary-rgb), 0.05)' : 'white', cursor: 'pointer', textAlign: 'center'
                        }}
                    >
                        <Key size={24} style={{ marginBottom: '0.5rem', color: mode === 'manual' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} />
                        <div style={{ fontWeight: '600' }}>Définir Manuellement</div>
                        <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>Pour le téléphone</div>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {mode === 'manual' && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Saisir le nouveau mot de passe</label>
                            <input
                                autoFocus
                                value={manualPass}
                                onChange={(e) => setManualPass(e.target.value)}
                                type="text"
                                placeholder="Ex: Pass1234"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))' }}
                            />
                        </div>
                    )}

                    <button
                        disabled={loading}
                        type="submit"
                        style={{
                            width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: 'none',
                            backgroundColor: 'hsl(var(--primary))', color: 'white', fontWeight: '600', cursor: 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'Réinitialiser et Envoyer'}
                    </button>
                    {error && (
                        <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.9rem', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

// UI Components
function TabButton({ active, onClick, icon, label, count, special }: any) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '2rem',
                backgroundColor: active ? (special ? '#7c3aed' : 'hsl(var(--primary))') : 'transparent',
                color: active ? 'white' : 'hsl(var(--muted-foreground))',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                whiteSpace: 'nowrap'
            }}
        >
            {icon} {label}
            {count > 0 && <span style={{ backgroundColor: 'white', color: 'hsl(var(--primary))', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.7rem' }}>{count}</span>}
        </button>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        pending: { bg: 'hsl(var(--secondary))', label: 'En Attente' },
        active: { bg: 'hsl(var(--primary))', label: 'Actif' },
        refused: { bg: '#ef4444', label: 'Refusé' }
    };
    const s = styles[status] || styles.active;
    return (
        <span style={{
            padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: '600',
            backgroundColor: s.bg, color: 'white'
        }}>
            {s.label}
        </span>
    );
}

function ActionButton({ onClick, icon, title, color = 'white', whiteIcon = false }: any) {
    return (
        <button onClick={onClick} title={title} style={{
            padding: '0.5rem', borderRadius: '50%', border: whiteIcon ? 'none' : '1px solid hsl(var(--border))',
            backgroundColor: color === 'white' ? 'white' : color,
            color: whiteIcon ? 'white' : 'hsl(var(--foreground))',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px'
        }}>
            {icon}
        </button>
    );
}
