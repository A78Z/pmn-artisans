import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as XLSX from '@sheetjs/xlsx';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function importExcel() {
    const filePath = path.resolve(process.cwd(), 'PMN BASE.xlsx');

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        console.log("Please place 'PMN BASE.xlsx' in the root directory.");
        process.exit(1);
    }

    console.log(`Reading file: ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rows = XLSX.utils.sheet_to_json(sheet);
    console.log(`Found ${rows.length} rows.`);

    let count = 0;
    for (const row of rows as any[]) {
        // Basic mapping - ASSUMING headers match requirements loosely
        // We need to be careful with column names from the Excel file on the user's disk.
        // I will try to map common variations or strict names if known.
        // Based on prompt: "Région", "Département", "Commune", "Quartier", "Filière PMN", "Métier / Corps de métier", "Nom du propriétaire", "Prénom du propriétaire", "Téléphone"

        try {
            const artisan = {
                region: row['Région'] || row['region'] || '',
                departement: row['Département'] || row['Departement'] || row['departement'] || '',
                commune: row['Commune'] || row['commune'] || '',
                quartier: row['Quartier'] || row['quartier'] || '',
                filiere: row['Filière PMN'] || row['Filière'] || row['filiere'] || '',
                metier: row['Métier / Corps de métier'] || row['Métier'] || row['metier'] || '',
                nom: row['Nom du propriétaire'] || row['Nom'] || row['nom'] || '',
                prenom: row['Prénom du propriétaire'] || row['Prénom'] || row['prenom'] || '',
                telephone: row['Téléphone'] || row['Telephone'] || row['telephone'] || '',
            };

            // Skip if empty (basic check)
            if (!artisan.nom && !artisan.prenom) continue;

            await prisma.artisan.create({
                data: {
                    region: String(artisan.region),
                    departement: String(artisan.departement),
                    commune: String(artisan.commune),
                    quartier: String(artisan.quartier),
                    filiere: String(artisan.filiere),
                    metier: String(artisan.metier),
                    nom: String(artisan.nom),
                    prenom: String(artisan.prenom),
                    telephone: String(artisan.telephone),
                }
            });
            count++;
            if (count % 100 === 0) console.log(`Imported ${count} artisans...`);
        } catch (e) {
            console.error("Error importing row:", row, e);
        }
    }

    console.log(`Import complete. Total imported: ${count}`);
}

importExcel()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
