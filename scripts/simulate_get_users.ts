
import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Parse = require('parse/node');

async function debugUsers() {
    const appId = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
    const jsKey = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;
    const serverUrl = process.env.NEXT_PUBLIC_PARSE_SERVER_URL;
    const masterKey = process.env.PARSE_MASTER_KEY;

    if (!appId || !serverUrl || !masterKey) {
        console.error("Missing env vars");
        return;
    }

    Parse.initialize(appId, jsKey, masterKey);
    Parse.serverURL = serverUrl;

    console.log("Connected to Parse at", serverUrl);

    try {
        const query = new Parse.Query(Parse.User);
        // Simulate 'all' filter
        // query.ascending("createdAt"); // let's try with descending like in the app
        query.descending("createdAt");
        query.limit(100);

        const count = await query.count({ useMasterKey: true });
        console.log(`Total Users (Count): ${count}`);

        const users = await query.find({ useMasterKey: true });
        console.log(`Found ${users.length} users with find()`);

        if (users.length > 0) {
            console.log("Sample User 1:", users[0].toJSON());
            console.log("Sample User 1 Role:", users[0].get("role"));
            console.log("Sample User 1 Status:", users[0].get("status"));
        } else {
            console.log("No users found properly.");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

debugUsers();
