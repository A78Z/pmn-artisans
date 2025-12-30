import 'dotenv/config';
import Parse from 'parse/node';

const appId = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID || "";
const jsKey = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY || "";
const serverUrl = process.env.NEXT_PUBLIC_PARSE_SERVER_URL || "";

Parse.initialize(appId, jsKey);
Parse.serverURL = serverUrl;

async function testDistinct() {
    console.log("Testing distinct query...");
    const query = new Parse.Query("Artisan");
    try {
        const regions = await query.distinct("region");
        console.log("Regions found:", regions);
    } catch (e) {
        console.error("Error fetching regions:", e);
    }
}

testDistinct();
