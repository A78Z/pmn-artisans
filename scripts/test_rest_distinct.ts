import 'dotenv/config';

const appId = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
const restKey = "m4II0xOLXGGLx0WJEyhFOqDBJp3qUVa5oLa34pHf"; // From create_admin.ts
const serverUrl = process.env.NEXT_PUBLIC_PARSE_SERVER_URL;

async function testRestDistinct() {
    const url = `${serverUrl}/aggregate/Artisan`;

    // Parse Aggregate syntax for distinct
    // Pipeline: [{ $group: { _id: "$region" } }]
    const pipeline = [
        { group: { objectId: "$region" } }
    ];

    console.log("Testing REST distinct...");
    try {
        const response = await fetch(`${url}?group=${JSON.stringify({ objectId: "$region" })}`, {
            headers: {
                'X-Parse-Application-Id': appId!,
                'X-Parse-REST-API-Key': restKey
            }
        });

        const data = await response.json();
        console.log("Aggregate Response:", JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log("Aggregation successful.");
        } else {
            console.log("Aggregation failed.");
        }
    } catch (e) {
        console.error(e);
    }
}

testRestDistinct();
