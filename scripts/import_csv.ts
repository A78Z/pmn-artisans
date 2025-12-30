import 'dotenv/config';
import Parse from 'parse/node';
import fs from 'fs';
import path from 'path';

// Initialize Parse
const appId = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID || "";
const jsKey = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY || "";
const serverUrl = process.env.NEXT_PUBLIC_PARSE_SERVER_URL || "";

if (!appId || !jsKey || !serverUrl) {
    console.error("Missing Back4App credentials.");
    process.exit(1);
}

Parse.initialize(appId, jsKey);
Parse.serverURL = serverUrl;

async function importCSV() {
    const filePath = path.resolve(process.cwd(), 'data_source.csv');
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    console.log(`Reading file: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf-8'); // Using latin1 or utf-8? Usually utf-8 but excel can be weird.
    // The previous cat output showed readable text, so likely utf-8 or compatible.

    const lines = fileContent.split(/\r?\n/);
    const headers = lines[0].split(';');
    // Header verification
    // REGION;DEPARTEMENT;COMMUNE;QUARTIER;FILIRES PMN;TELEPHONE;PRENOM PROPRIETAIRE;NOM PROPRIETAIRE;FILIERE

    console.log(`Found ${lines.length} lines (including header).`);

    let count = 0;
    const batchSize = 50;
    let batch: Parse.Object[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(';');

        // Mapping based on index
        // 0: REGION
        // 1: DEPARTEMENT
        // 2: COMMUNE
        // 3: QUARTIER
        // 4: FILIRES PMN (-> filiere)
        // 5: TELEPHONE
        // 6: PRENOM PROPRIETAIRE
        // 7: NOM PROPRIETAIRE
        // 8: FILIERE (-> metier)

        if (cols.length < 8) {
            console.warn(`Skipping line ${i}: Insufficient columns`);
            continue;
        }

        const artisan = new Parse.Object("Artisan");
        artisan.set("region", cols[0]?.trim());
        artisan.set("departement", cols[1]?.trim());
        artisan.set("commune", cols[2]?.trim());
        artisan.set("quartier", cols[3]?.trim());
        artisan.set("filiere", cols[4]?.trim());
        artisan.set("telephone", cols[5]?.trim());
        artisan.set("prenom", cols[6]?.trim());
        artisan.set("nom", cols[7]?.trim());
        artisan.set("metier", cols[8]?.trim()); // Mapping FILIERE to metier

        // Create ACL
        const acl = new Parse.ACL();
        acl.setPublicReadAccess(true);
        acl.setPublicWriteAccess(false); // Only admin can write ideally
        artisan.setACL(acl);

        batch.push(artisan);

        if (batch.length >= batchSize) {
            try {
                await Parse.Object.saveAll(batch);
                count += batch.length;
                console.log(`Imported ${count} artisans...`);
                batch = [];
            } catch (error) {
                console.error(`Error saving batch at line ${i}:`, error);
                // Try to continue?
            }
        }
    }

    if (batch.length > 0) {
        try {
            await Parse.Object.saveAll(batch);
            count += batch.length;
        } catch (error) {
            console.error("Error saving final batch:", error);
        }
    }

    console.log(`Import complete. Total imported: ${count}`);
}

importCSV()
    .catch(console.error);
