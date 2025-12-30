
import { createRequire } from 'module';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const require = createRequire(import.meta.url);
const Parse = require('parse/node');

const updateAdmin = async () => {
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

    console.log("🛠️ Updating Admin Data for Harouna...");

    try {
        const query = new Parse.Query(Parse.User);
        query.equalTo("email", "syllaharouna740@gmail.com");
        const admin = await query.first({ useMasterKey: true });

        if (!admin) {
            console.error("❌ Admin not found!");
            return;
        }

        admin.set("nom", "SYLLA");
        admin.set("prenom", "Harouna");
        admin.set("chambreName", "Administration PMN"); // Special value for Admins

        await admin.save(null, { useMasterKey: true });
        console.log("✅ Admin updated successfully!");
        console.log("   Nom:", admin.get("nom"));
        console.log("   Prenom:", admin.get("prenom"));
    } catch (e: any) {
        console.error("Error updating admin:", e);
    }
};

updateAdmin();
