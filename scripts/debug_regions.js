
const Parse = require('parse/node');

const appId = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID || 'PMN_DATAHUB_ID';
const jsKey = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY || 'PMN_DATAHUB_JS_KEY';
const serverUrl = process.env.NEXT_PUBLIC_PARSE_SERVER_URL || 'https://parseapi.back4app.com/';

Parse.initialize(appId, jsKey);
Parse.serverURL = serverUrl;

async function checkRegions() {
    console.log("Checking Region class...");
    try {
        const query = new Parse.Query("Region");
        const results = await query.find();
        console.log(`Found ${results.length} regions.`);
        if (results.length > 0) {
            const first = results[0];
            console.log("First Metadata:", first.toJSON());
            console.log("Keys:", Object.keys(first.toJSON()));
        } else {
            console.log("No regions found.");
        }
    } catch (error) {
        console.error("Error fetching regions:", error);
    }
}

checkRegions();
