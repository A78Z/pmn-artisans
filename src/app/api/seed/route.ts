import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Basic security: only allow in dev or with secret
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
        }

        const count = await prisma.artisan.count();
        if (count > 0) {
            return NextResponse.json({ message: "Database already has data", count });
        }

        const artisans = [
            // DAKAR
            { region: "Dakar", departement: "Dakar", commune: "Plateau", quartier: "Centre Ville", filiere: "Textile", metier: "Couturier", nom: "Diop", prenom: "Amadou", telephone: "770000001" },
            { region: "Dakar", departement: "Dakar", commune: "Medina", quartier: "Tilene", filiere: "Textile", metier: "Tailleur", nom: "Fall", prenom: "Moussa", telephone: "770000002" },
            { region: "Dakar", departement: "Pikine", commune: "Pikine Est", quartier: "Ainmane", filiere: "Cuir", metier: "Cordonnier", nom: "Sarr", prenom: "Abdou", telephone: "770000003" },
            { region: "Dakar", departement: "Pikine", commune: "Pikine Nord", quartier: "Icotaf", filiere: "Bâtiment", metier: "Maçon", nom: "Gueye", prenom: "Lamine", telephone: "770000004" },

            // THIES
            { region: "Thiès", departement: "Mbour", commune: "Saly", quartier: "Saly Nord", filiere: "Artisanat d'art", metier: "Sculpteur", nom: "Ndiaye", prenom: "Fatou", telephone: "770000010" },
            { region: "Thiès", departement: "Mbour", commune: "Joal", quartier: "Escale", filiere: "Agroalimentaire", metier: "Transformateur", nom: "Faye", prenom: "Astou", telephone: "770000011" },
            { region: "Thiès", departement: "Thiès", commune: "Thiès Nord", quartier: "Nguinth", filiere: "Métal", metier: "Soudeur", nom: "Seck", prenom: "Modou", telephone: "770000012" },

            // SAINT-LOUIS
            { region: "Saint-Louis", departement: "Podor", commune: "Podor", quartier: "Mbodiene", filiere: "Bâtiment", metier: "Peintre", nom: "Sow", prenom: "Oumar", telephone: "770000020" },
            { region: "Saint-Louis", departement: "Saint-Louis", commune: "Saint-Louis", quartier: "Ndar Toute", filiere: "Textile", metier: "Teinturier", nom: "Ba", prenom: "Mariama", telephone: "770000021" },

            // ZIGUINCHOR
            { region: "Ziguinchor", departement: "Ziguinchor", commune: "Ziguinchor", quartier: "Boucotte", filiere: "Bois", metier: "Menuisier", nom: "Mendy", prenom: "Jean", telephone: "770000030" },
        ];

        for (const artisan of artisans) {
            await prisma.artisan.create({
                data: artisan
            });
        }

        return NextResponse.json({ message: "Seeded successfully", count: artisans.length });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Seed failed" }, { status: 500 });
    }
}
