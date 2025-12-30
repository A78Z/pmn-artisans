
import { createRequire } from 'module';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const require = createRequire(import.meta.url);
const Parse = require('parse/node');

const checkArtisans = async () => {
    if (!process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID || !process.env.PARSE_MASTER_KEY) {
        console.error("❌ Credentials missing in .env");
        return;
    }

    Parse.initialize(
        process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID,
        process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY || '',
        process.env.PARSE_MASTER_KEY
    );
    Parse.serverURL = process.env.NEXT_PUBLIC_PARSE_SERVER_URL || 'https://parseapi.back4app.com';

    console.log("🔍 Checking 'Artisan' Class in DB...");

    try {
        const query = new Parse.Query("Artisan");
        const count = await query.count({ useMasterKey: true });
        console.log(`✅ Total 'Artisan' Objects Found: ${count}`);

        if (count > 0) {
            const firstFew = await query.limit(5).find({ useMasterKey: true });
            firstFew.forEach((u: any) => {
                console.log(` - ID: ${u.id} | Nom: ${u.get('nom')}`);
            });
        }
    } catch (e: any) {
        console.error("❌ Error fetching artisans:", e);
    }
};

checkArtisans();
