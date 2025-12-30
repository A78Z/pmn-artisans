
import { createRequire } from 'module';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const require = createRequire(import.meta.url);
const Parse = require('parse/node');

const checkAdmin = async () => {
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

    console.log("🔍 Searching for potential Admin users...");

    const query = new Parse.Query(Parse.User);
    // Assuming Harouna is an admin, let's look for admins
    query.containedIn("role", ["admin", "super_admin"]);
    const admins = await query.find({ useMasterKey: true });

    if (admins.length === 0) {
        console.log("❌ No admins found via role check. Searching all users for 'Harouna'...");
        const nameQuery = new Parse.Query(Parse.User);
        nameQuery.matches("username", "Harouna", "i"); // case insensitive regex
        const matches = await nameQuery.find({ useMasterKey: true });
        matches.forEach((u: any) => printUser(u));
    } else {
        console.log(`✅ Found ${admins.length} admins.`);
        admins.forEach((u: any) => printUser(u));
    }
};

function printUser(user: any) {
    console.log("------------------------------------------------");
    console.log(`User ID: ${user.id}`);
    console.log(`Username: ${user.get("username")}`);
    console.log(`Email: ${user.get("email")}`);
    console.log(`Role: ${user.get("role")}`);
    console.log(`Nom: ${user.get("nom")}`);
    console.log(`Prenom: ${user.get("prenom")}`);
    console.log(`Chambre: ${user.get("chambreName")}`);
    console.log("------------------------------------------------");
}

checkAdmin();
