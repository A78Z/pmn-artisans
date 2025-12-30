import dotenv from 'dotenv';
// Load from .env.local if present, else .env
import fs from 'fs';
import path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
} else {
    dotenv.config({ path: envPath });
}

const appId = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
const restKey = "m4II0xOLXGGLx0WJEyhFOqDBJp3qUVa5oLa34pHf"; // Hardcoded from previous script
const serverUrl = process.env.NEXT_PUBLIC_PARSE_SERVER_URL || "https://parseapi.back4app.com";

if (!appId) {
    console.error("Missing NEXT_PUBLIC_PARSE_APPLICATION_ID");
    process.exit(1);
}

const targetEmail = "syllaharouna740@gmail.com";
const password = "Admin@2025";

async function diagnose() {
    console.log(`--- DIAGNOSTIC START ---`);
    console.log(`Target: ${targetEmail}`);
    console.log(`App ID: ${appId ? appId.substring(0, 5) + '...' : 'MISSING'}`);
    console.log(`Server URL: ${serverUrl}`);

    // 1. Try Login
    console.log(`\n1. Attempting Login with '${password}'...`);
    const loginUrl = `${serverUrl}/login?username=${encodeURIComponent(targetEmail)}&password=${encodeURIComponent(password)}`;

    try {
        const res = await fetch(loginUrl, {
            headers: {
                'X-Parse-Application-Id': appId!,
                'X-Parse-REST-API-Key': restKey, // Using REST key
                'X-Parse-Revocable-Session': '1'
            }
        });

        const data = await res.json();

        if (res.ok) {
            console.log("✅ LOGIN SUCCESS");
            console.log(`User ID: ${data.objectId}`);
            console.log(`Username: ${data.username}`);
            console.log(`Email: ${data.email}`);
            console.log(`Role: '${data.role}'`);
            console.log(`Status: '${data.status}'`);
            console.log(`ACL:`, JSON.stringify(data.ACL));

            if (data.role !== 'admin' && data.role !== 'super_admin') {
                console.error("❌ ISSUE: Role is NOT 'admin' or 'super_admin'!");

                // Attempt to auto-fix
                console.log("Attempting to fix role to 'super_admin' using Session Token...");
                const updateUrl = `${serverUrl}/users/${data.objectId}`;
                const updateRes = await fetch(updateUrl, {
                    method: 'PUT',
                    headers: {
                        'X-Parse-Application-Id': appId!,
                        'X-Parse-REST-API-Key': restKey,
                        'X-Parse-Session-Token': data.sessionToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ role: 'super_admin' })
                });
                const updateData = await updateRes.json();
                if (updateRes.ok) {
                    console.log("✅ ROLE UPDATED TO 'super_admin'");
                } else {
                    console.error("❌ FAILED TO UPDATE ROLE:", updateData);
                }
            } else {
                console.log("✅ Role is correct.");
            }

        } else {
            console.error("❌ LOGIN FAILED");
            console.error(`Status: ${res.status}`);
            console.error(`Error:`, data);

            if (data.code === 101) {
                console.log("-> Invalid username/password.");
            }
        }

    } catch (e) {
        console.error("Fetch Error:", e);
    }
    console.log(`--- DIAGNOSTIC END ---`);
}

diagnose();
