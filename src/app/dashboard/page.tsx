import { auth } from "@/app/lib/auth";
import { getFilterOptions } from "@/app/lib/actions";
import { getArtisansServer } from "@/app/lib/data";
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    // 1. Check Session (Server Side)
    const session = await auth();
    if (!session || !session.user) {
        redirect("/login");
    }

    // 2. Prepare Filters from URL Params
    const sp = await searchParams; // Next.js 15+ searchParams is async, good to await just in case or use directly if 14

    // Normalize params
    const getParam = (k: string) => {
        const val = sp[k];
        return typeof val === 'string' ? val : undefined;
    };

    const initialFilters = {
        search: getParam('search') || '',
        region: getParam('region') || '',
        departement: getParam('departement') || '',
        commune: getParam('commune') || '',
        quartier: getParam('quartier') || '',
        filiere: getParam('filiere') || '',
        metier: getParam('metier') || '',
        page: parseInt(getParam('page') || '1'),
        limit: parseInt(getParam('limit') || '25'),
    };

    // 3. Fetch Data in Parallel (Server Side)
    // We use useMasterKey inside these functions so no session dependency needed for data
    const [filtersRes, artisansRes] = await Promise.all([
        getFilterOptions({
            region: initialFilters.region,
            departement: initialFilters.departement,
            commune: initialFilters.commune,
            filiere: initialFilters.filiere
        }),
        getArtisansServer({
            ...initialFilters
        })
    ]);

    const initialOptions = filtersRes.success && filtersRes.data ? filtersRes.data : {
        regions: [],
        departements: [],
        communes: [],
        quartiers: [],
        filieres: [],
        metiers: []
    };

    return (
        <DashboardClient
            initialData={artisansRes.data}
            initialTotal={artisansRes.total}
            initialTotalPages={artisansRes.totalPages}
            initialFilters={initialFilters}
            initialOptions={initialOptions}
            user={session.user}
        />
    );
}
