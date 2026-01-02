import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import Parse, { ensureParseInitialized } from "@/app/lib/parse";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
    // Debug 1: Check Auth
    const session = await auth();
    console.log("API /api/artisans - Session:", session?.user?.email);

    if (!session) {
        console.log("API /api/artisans - Unauthorized");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure Parse is ready
    await ensureParseInitialized();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const search = searchParams.get("search") || "";
    const region = searchParams.get("region");
    const departement = searchParams.get("departement");
    const commune = searchParams.get("commune");
    const quartier = searchParams.get("quartier");
    const filiere = searchParams.get("filiere");
    const metier = searchParams.get("metier");

    console.log("API /api/artisans - Filters:", { search, region, departement, commune, metier });

    try {
        let query = new Parse.Query("Artisan");

        // Apply Filters
        if (region) query.equalTo("region", region);
        if (departement) query.equalTo("departement", departement);
        if (commune) query.equalTo("commune", commune);
        if (quartier) query.equalTo("quartier", quartier);
        if (filiere) query.equalTo("filiere", filiere);
        if (metier) query.equalTo("metier", metier);

        // Apply Search
        if (search) {
            // Helper to create accent-insensitive regex
            const createAccentRegex = (text: string) => {
                return text.replace(/[a-zA-Z]/g, (char) => {
                    const base = char.toLowerCase();
                    const accents: { [key: string]: string } = {
                        a: "[aàáâãäå]",
                        e: "[eèéêë]",
                        i: "[iìíîï]",
                        o: "[oòóôõö]",
                        u: "[uùúûü]",
                        c: "[cç]",
                        n: "[nñ]",
                        y: "[yýÿ]"
                    };
                    return accents[base] ? `(${accents[base]}|${accents[base].toUpperCase()})` : char;
                });
            };

            const regexPattern = createAccentRegex(search);

            // Create queries for each searchable field
            const searchableFields = [
                "nom", "prenom", "telephone",
                "region", "departement", "commune", "quartier",
                "filiere", "metier"
            ];

            const queries = searchableFields.map(field => {
                const q = new Parse.Query("Artisan");
                // Use RegExp object to avoid TS error, or regex string if library supports it. 
                // Parse JS SDK supports regex string for .matches but sometimes types are strict.
                // Safest to use new RegExp if pattern is string.
                q.matches(field, new RegExp(regexPattern, "i"));
                return q;
            });

            const applyFilters = (q: Parse.Query) => {
                if (region) q.equalTo("region", region);
                if (departement) q.equalTo("departement", departement);
                if (commune) q.equalTo("commune", commune);
                if (quartier) q.equalTo("quartier", quartier);
                if (filiere) q.equalTo("filiere", filiere);
                if (metier) q.equalTo("metier", metier);
            };

            queries.forEach(q => applyFilters(q));

            query = Parse.Query.or(...(queries as any[]));
        }

        query.skip(skip);
        query.limit(limit);
        query.descending("createdAt");

        const results = await query.find({ useMasterKey: true });
        console.log(`API /api/artisans - Found ${results.length} results (MasterKey used)`);

        // Count - optimize
        const count = results.length < limit && page === 1 ? results.length : 1000; // Fake count for speed if not needed strictly, or use query.count()
        // Let's use real count for now but secure it
        const realCount = await query.count({ useMasterKey: true });

        const data = results.map(r => ({
            id: r.id,
            region: r.get("region"),
            departement: r.get("departement"),
            commune: r.get("commune"),
            quartier: r.get("quartier"),
            filiere: r.get("filiere"),
            metier: r.get("metier"),
            nom: r.get("nom"),
            prenom: r.get("prenom"),
            telephone: r.get("telephone"),
            createdAt: r.get("createdAt")
        }));

        return NextResponse.json({
            data,
            total: realCount,
            page,
            totalPages: Math.ceil(realCount / limit),
        });
    } catch (error: any) {
        console.error("Error fetching artisans:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
