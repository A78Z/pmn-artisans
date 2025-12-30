import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL || "file:./dev.db"
});

async function main() {
    // Clear existing
    // await prisma.artisan.deleteMany();

    const artisans = [
        {
            region: "Dakar",
            departement: "Dakar",
            commune: "Plateau",
            quartier: "Centre Ville",
            filiere: "Textile",
            metier: "Couturier",
            nom: "Diop",
            prenom: "Amadou",
            telephone: "770000001"
        },
        {
            region: "Thiès",
            departement: "Mbour",
            commune: "Saly",
            quartier: "Saly Nord",
            filiere: "Artisanat d'art",
            metier: "Sculpteur",
            nom: "Ndiaye",
            prenom: "Fatou",
            telephone: "770000002"
        },
        {
            region: "Saint-Louis",
            departement: "Podor",
            commune: "Podor",
            quartier: "Mbodiene",
            filiere: "Bâtiment",
            metier: "Maçon",
            nom: "Sow",
            prenom: "Oumar",
            telephone: "770000003"
        },
    ];

    for (const artisan of artisans) {
        await prisma.artisan.create({
            data: artisan
        });
    }

    console.log('Seeded database with mock artisans');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
