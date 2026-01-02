'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, Filter, Loader2, Phone } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Autocomplete from '@/app/ui/Autocomplete';
import Pagination from '@/app/ui/Pagination';
import { getFilterOptions } from '@/app/lib/actions';

function DashboardContent() {
    const { data: session, update } = useSession();
    const searchParams = useSearchParams();

    // Force session update if user data is incomplete (fixes header display issue)
    useEffect(() => {
        if (session?.user && !(session.user as any).nom) {
            console.log("Session incomplete, forcing update...");
            update();
        }
    }, [session, update]);
    // ...

    const router = useRouter();
    const pathname = usePathname();

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Initial Filters state from URL
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        region: searchParams.get('region') || '',
        departement: searchParams.get('departement') || '',
        commune: searchParams.get('commune') || '',
        quartier: searchParams.get('quartier') || '',
        filiere: searchParams.get('filiere') || '',
        metier: searchParams.get('metier') || '',
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '25'),
    });

    // Intelligent Options State
    const [filterOptions, setFilterOptions] = useState({
        regions: [] as string[],
        departements: [] as string[],
        communes: [] as string[],
        quartiers: [] as string[],
        filieres: [] as string[],
        metiers: [] as string[],
    });

    // Fetch intelligent options when filters change
    useEffect(() => {
        const fetchOptions = async () => {
            const res = await getFilterOptions({
                region: filters.region,
                departement: filters.departement,
                commune: filters.commune,
                filiere: filters.filiere
            });
            if (res.success && res.data) {
                setFilterOptions(res.data);
            }
        };
        fetchOptions();
    }, [filters.region, filters.departement, filters.commune, filters.quartier, filters.filiere, filters.metier]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, String(value));
        });

        try {
            const res = await fetch(`/api/artisans?${params.toString()}`);

            if (res.status === 401) {
                // Session expired or invalid
                signOut({ callbackUrl: '/login' });
                return;
            }

            if (!res.ok) {
                throw new Error("Erreur de chargement");
            }

            const json = await res.json();
            if (json.data) {
                setData(json.data);
                setTotal(json.total);
                setTotalPages(json.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
            // Optionally set error state here if UI needs to show it
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const updateUrl = (newFilters: any) => {
        const params = new URLSearchParams();
        Object.entries(newFilters).forEach(([k, v]) => {
            if (v && v !== '') params.append(k, String(v));
        });
        router.replace(`${pathname}?${params.toString()}`);
    };

    const handleFilterChange = (key: string, value: string) => {
        // Reset to page 1 when filtering
        const newFilters = { ...filters, [key]: value, page: 1 };
        setFilters(newFilters);
        updateUrl(newFilters);
    };

    const handlePageChange = (newPage: number) => {
        const newFilters = { ...filters, page: newPage };
        setFilters(newFilters);
        updateUrl(newFilters);
        // Scroll to top of results
        const resultTop = document.querySelector('.highlight-zone');
        if (resultTop) resultTop.scrollIntoView({ behavior: 'smooth' });
    };

    const handleLimitChange = (newLimit: number) => {
        const newFilters = { ...filters, limit: newLimit, page: 1 };
        setFilters(newFilters);
        updateUrl(newFilters);
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Toggle Sidebar
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'transparent' }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                @media (max-width: 1024px) {
                    .hide-on-mobile { display: none !important; }
                    .show-on-mobile { display: flex !important; }
                    
                    /* Layout Adjustments */
                    .dashboard-header { padding: 0 1.25rem !important; height: 70px !important; }
                    .dashboard-main { padding: 1.25rem 1rem !important; }
                    
                    /* Sidebar Styling */
                    .sidebar-container {
                        position: fixed;
                        top: 70px;
                        left: 0;
                        bottom: 0;
                        width: 100%;
                        background: rgba(255, 255, 255, 0.98) !important;
                        z-index: 40;
                        transform: translateX(-100%);
                        transition: transform 0.3s ease;
                        padding-top: 1rem !important;
                    }
                    .sidebar-container.open {
                        transform: translateX(0);
                    }

                    /* No Results Fix */
                    .no-results-cell {
                        display: flex !important;
                        justify-content: center !important;
                        text-align: center !important;
                        width: 100% !important;
                        padding: 3rem !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    
                    /* Hide Table Head on Mobile */
                    thead { display: none !important; }
                    
                    tbody tr {
                        display: flex !important;
                        flex-direction: column !important;
                        background: white !important;
                        margin-bottom: 1rem !important;
                        border-radius: 1rem !important;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.06) !important;
                        padding: 1.25rem !important;
                        border: 1px solid rgba(0,0,0,0.05) !important;
                        position: relative;
                    }

                    tbody td {
                        display: flex !important;
                        justify-content: space-between !important;
                        align-items: center !important;
                        padding: 0.5rem 0 !important;
                        border: none !important;
                        border-bottom: 1px solid rgba(0,0,0,0.03) !important;
                        text-align: right !important;
                        width: 100% !important;
                    }
                    
                    tbody td:last-child {
                        border-bottom: none !important;
                        padding-top: 1rem !important;
                        margin-top: 0.5rem !important;
                        justify-content: center !important;
                    }

                    /* Add Labels via pseudo-elements for clarity/logic if needed, 
                       but strictly following current structure, we rely on context.
                       However, enforcing alignment is key.
                    */
                }
                @media (min-width: 1025px) {
                    .show-on-mobile { display: none !important; }
                    .sidebar-container {
                        width: 340px;
                        position: relative;
                        transform: none !important;
                    }
                }
            `}} />

            {/* HERDER */}
            <header className="dashboard-header" style={{
                height: '80px',
                padding: '0 3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
                position: 'sticky',
                top: 0,
                zIndex: 50
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Mobile Menu Button */}
                    <button
                        className="show-on-mobile"
                        onClick={toggleSidebar}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            marginRight: '0.5rem',
                            color: 'hsl(var(--foreground))'
                        }}
                    >
                        {isSidebarOpen ? <Filter size={24} /> : <Filter size={24} />}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <img
                            src="/images/pmn_logo.png"
                            alt="PMN Logo"
                            style={{ height: '50px', width: 'auto', objectFit: 'contain' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div className="hide-on-mobile" style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', fontWeight: '500', letterSpacing: '0.02rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {session?.user && (
                            <span style={{ color: 'hsl(var(--foreground))', fontWeight: '600', textTransform: 'capitalize' }}>
                                {(session.user as any).nom} {(session.user as any).prenom}
                            </span>
                        )}
                        <span style={{ color: 'hsl(var(--border))' }}>|</span>
                        <span>{(session?.user as any)?.chambre || "Chambre des Métiers"}</span>
                    </div>
                    <button
                        className="btn"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        style={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            color: 'hsl(var(--foreground))',
                            fontSize: '0.85rem',
                            padding: '0.6rem 1.4rem',
                            borderRadius: '2rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                    >
                        Déconnexion
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                {/* SIDEBAR FILTERS */}
                <aside
                    className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`}
                    style={{
                        padding: '2rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        backdropFilter: 'blur(15px)',
                        WebkitBackdropFilter: 'blur(15px)',
                        borderRight: '1px solid rgba(255, 255, 255, 0.5)',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', paddingLeft: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Filter size={22} style={{ color: 'hsl(var(--primary))' }} />
                            <h2 style={{ fontWeight: '700', fontSize: '1.2rem', color: 'hsl(var(--foreground))', letterSpacing: '-0.01em' }}>Filtres</h2>
                        </div>
                        {isSidebarOpen && (
                            <button onClick={toggleSidebar} className="show-on-mobile" style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
                        <Autocomplete
                            label="Région"
                            placeholder="Toutes les régions"
                            value={filters.region}
                            options={filterOptions.regions}
                            onChange={(val) => {
                                const newFilters = { ...filters, region: val, departement: '', commune: '', quartier: '', page: 1 };
                                setFilters(newFilters);
                                updateUrl(newFilters);
                            }}
                        />

                        <Autocomplete
                            label="Département"
                            placeholder="Tous les départements"
                            value={filters.departement}
                            options={filterOptions.departements}
                            onChange={(val) => {
                                const newFilters = { ...filters, departement: val, commune: '', quartier: '', page: 1 };
                                setFilters(newFilters);
                                updateUrl(newFilters);
                            }}
                            disabled={!filters.region}
                        />

                        <Autocomplete
                            label="Commune"
                            placeholder="Toutes les communes"
                            value={filters.commune}
                            options={filterOptions.communes}
                            onChange={(val) => {
                                const newFilters = { ...filters, commune: val, quartier: '', page: 1 };
                                setFilters(newFilters);
                                updateUrl(newFilters);
                            }}
                            disabled={!filters.departement}
                        />

                        <Autocomplete
                            label="Quartier"
                            placeholder="Tous les quartiers"
                            value={filters.quartier}
                            options={filterOptions.quartiers}
                            onChange={(val) => handleFilterChange('quartier', val)}
                            disabled={!filters.commune}
                        />

                        <div style={{ height: '1px', backgroundColor: 'rgba(0,0,0,0.05)', margin: '0.5rem 0' }} />

                        <Autocomplete
                            label="Filière"
                            placeholder="Toutes les filières"
                            value={filters.filiere}
                            options={filterOptions.filieres}
                            onChange={(val) => {
                                const newFilters = { ...filters, filiere: val, metier: '', page: 1 };
                                setFilters(newFilters);
                                updateUrl(newFilters);
                            }}
                        />

                        <Autocomplete
                            label="Métier"
                            placeholder="Tous les métiers"
                            value={filters.metier}
                            options={filterOptions.metiers}
                            onChange={(val) => handleFilterChange('metier', val)}
                            disabled={!filters.filiere}
                        />

                        {/* Apply Filters Button (Mobile Only) */}
                        <button
                            className="show-on-mobile btn"
                            onClick={toggleSidebar}
                            style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                backgroundColor: 'hsl(var(--primary))',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontWeight: 'bold'
                            }}
                        >
                            Voir les résultats
                        </button>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="dashboard-main" style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto', backgroundColor: 'transparent' }}>

                    {/* TOP SEARCH - Floating */}
                    <div style={{ marginBottom: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <div style={{ position: 'relative', width: '100%', maxWidth: '680px' }}>
                            <Search size={22} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))', opacity: 0.7 }} />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '1.1rem 1.5rem 1.1rem 4rem',
                                    borderRadius: '1.5rem',
                                    border: '1px solid rgba(255, 255, 255, 0.5)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    outline: 'none',
                                    boxShadow: '0 10px 25px -5px rgba(31, 122, 76, 0.08), 0 0 0 1px rgba(255,255,255,0.6) inset',
                                    fontSize: '1rem',
                                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                    backdropFilter: 'blur(10px)'
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(31, 122, 76, 0.12), 0 0 0 2px hsl(var(--primary)) inset';
                                    e.currentTarget.style.backgroundColor = 'white';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(31, 122, 76, 0.08), 0 0 0 1px rgba(255,255,255,0.6) inset';
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                                }}
                            />
                        </div>
                    </div>

                    {/* DATA CONTAINER - COLORED ZONE */}
                    <div className="highlight-zone">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center', padding: '0 0.5rem' }}>
                            <h3 style={{ fontWeight: '700', fontSize: '1.25rem', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Résultats <span style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', fontWeight: '500', backgroundColor: 'rgba(0,0,0,0.03)', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>{total}</span>
                            </h3>
                            {loading && <Loader2 className="animate-spin text-primary" />}
                        </div>

                        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'separate', borderSpacing: '0 0.75rem', fontSize: '0.95rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: 'hsl(var(--muted-foreground))', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>
                                        <th style={{ padding: '0.75rem 1.5rem' }}>Prénom & Nom</th>
                                        <th style={{ padding: '0.75rem 1rem' }}>Métier</th>
                                        <th style={{ padding: '0.75rem 1rem' }}>Filière</th>
                                        <th style={{ padding: '0.75rem 1rem' }}>Localisation</th>
                                        <th style={{ padding: '0.75rem 1.5rem' }}>Téléphone</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((artisan) => (
                                        <tr key={artisan.id} style={{
                                            backgroundColor: '#fff',
                                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                            borderRadius: 'var(--radius)',
                                            cursor: 'default'
                                        }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.002)';
                                                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)';
                                                e.currentTarget.style.zIndex = '10';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'none';
                                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                                                e.currentTarget.style.zIndex = '1';
                                            }}
                                        >
                                            <td style={{ padding: '1.25rem 1.5rem', fontWeight: '600', borderTopLeftRadius: 'var(--radius)', borderBottomLeftRadius: 'var(--radius)', color: 'hsl(var(--foreground))' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem', textAlign: 'left' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="show-on-mobile">Artisan</span>
                                                    <span style={{ fontSize: '1.1rem' }}>{artisan.prenom} {artisan.nom}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem', color: 'hsl(var(--muted-foreground))', fontWeight: '500' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem', textAlign: 'right', width: '100%' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="show-on-mobile">Métier</span>
                                                    <span>{artisan.metier}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <span style={{
                                                    padding: '0.35rem 0.9rem',
                                                    borderRadius: '2rem',
                                                    backgroundColor: 'hsl(var(--secondary))',
                                                    color: '#fff',
                                                    fontSize: '0.7rem',
                                                    fontWeight: '700',
                                                    boxShadow: '0 4px 6px -1px rgba(255, 209, 0, 0.3)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                                }}>
                                                    {artisan.filiere}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem', textAlign: 'right', width: '100%' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="show-on-mobile">Localisation</span>
                                                    <div style={{ fontWeight: '600', color: 'hsl(var(--foreground))' }}>{artisan.commune}, {artisan.quartier}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end' }}>
                                                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'hsl(var(--muted-foreground))' }}></span>
                                                        {artisan.departement}, {artisan.region}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', borderTopRightRadius: 'var(--radius)', borderBottomRightRadius: 'var(--radius)', color: 'hsl(var(--primary))' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', width: '100%' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="show-on-mobile">Contact</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <span style={{ fontFamily: 'monaco, consolas, monospace', fontSize: '1.1rem', fontWeight: '600' }}>
                                                            {artisan.telephone}
                                                        </span>
                                                        {artisan.telephone && (
                                                            <a
                                                                href={`tel:${artisan.telephone.replace(/\s/g, '')}`}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    width: '42px',
                                                                    height: '42px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: 'hsl(var(--primary))',
                                                                    color: '#fff',
                                                                    transition: 'all 0.2s',
                                                                    boxShadow: '0 4px 12px rgba(31, 122, 76, 0.3)'
                                                                }}
                                                                title="Appeler"
                                                            >
                                                                <Phone size={20} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!loading && data.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="no-results-cell" style={{ padding: '4rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                                    <Search size={48} style={{ opacity: 0.2 }} />
                                                    <p>Aucun artisan trouvé avec ces critères.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {!loading && total > 0 && (
                        <div style={{ marginTop: '2.5rem' }}>
                            <Pagination
                                currentPage={filters.page}
                                totalPages={totalPages}
                                totalItems={total}
                                itemsPerPage={filters.limit}
                                onPageChange={handlePageChange}
                                onItemsPerPageChange={handleLimitChange}
                            />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 className="animate-spin" /></div>}>
            <DashboardContent />
        </Suspense>
    );
}
