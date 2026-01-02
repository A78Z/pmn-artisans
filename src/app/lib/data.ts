import Parse, { ensureParseInitialized } from "@/app/lib/parse";

export type ArtisanFilterParams = {
    search?: string;
    region?: string;
    departement?: string;
    commune?: string;
    quartier?: string;
    filiere?: string;
    metier?: string;
    page?: number;
    limit?: number;
};

export async function getArtisansServer(params: ArtisanFilterParams) {
    await ensureParseInitialized();

    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const { search, region, departement, commune, quartier, filiere, metier } = params;

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

        const searchableFields = [
            "nom", "prenom", "telephone",
            "region", "departement", "commune", "quartier",
            "filiere", "metier"
        ];

        const queries = searchableFields.map(field => {
            const q = new Parse.Query("Artisan");
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

    // For pagination count
    const total = await query.count({ useMasterKey: true });

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
        createdAt: r.get("createdAt") ? r.get("createdAt").toISOString() : null
    }));

    return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}
