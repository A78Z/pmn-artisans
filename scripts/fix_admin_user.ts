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

const targetEmail = "syllaharouna740@gmail.com";
const desiredValues = {
    role: "super_admin",
    status: "active"
};

async function fixAdminUser() {
    console.log(`--- FIX ADMIN USER START ---`);
    console.log(`Target: ${targetEmail}`);

    // 1. Login to get Session Token (needed to update own user if Master Key fails or just to verify pwd)
    // We try to login with "Admin@2025"
    console.log(`\n1. Login...`);
    const loginUrl = `${serverUrl}/login?username=${encodeURIComponent(targetEmail)}&password=${encodeURIComponent("Admin@2025")}`;

    let sessionToken = "";
    let objectId = "";
    let currentRole = "";

    try {
        const res = await fetch(loginUrl, {
            headers: {
                'X-Parse-Application-Id': appId!,
                'X-Parse-REST-API-Key': restKey,
                'X-Parse-Revocable-Session': '1'
            }
        });
        const data = await res.json();

        if (res.ok) {
            console.log("✅ Login Success");
            sessionToken = data.sessionToken;
            objectId = data.objectId;
            currentRole = data.role;
        } else {
            console.error("❌ Login Failed:", data);
            // If login fails, we can't easily update without Master Key or resetting pwd.
            // But from previous context, we know login works.
            return;
        }

        // 2. Update if necessary
        if (currentRole !== desiredValues.role || data.status !== desiredValues.status) {
            console.log(`\n2. Updating User...`);
            console.log(`Current: Role=${currentRole}, Status=${data.status}`);
            console.log(`Target: Role=${desiredValues.role}, Status=${desiredValues.status}`);

            const updateUrl = `${serverUrl}/users/${objectId}`;
            const updateRes = await fetch(updateUrl, {
                method: 'PUT',
                headers: {
                    'X-Parse-Application-Id': appId!,
                    'X-Parse-REST-API-Key': restKey,
                    'X-Parse-Session-Token': sessionToken, // Use session token to update self
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(desiredValues)
            });

            if (updateRes.ok) {
                console.log("✅ User Updated Successfully");
            } else {
                const err = await updateRes.json();
                console.error("❌ Update Failed:", err);
            }
        } else {
            console.log("✅ User is already correctly configured.");
        }

    } catch (e) {
        console.error("Fetch Error:", e);
    }
    console.log(`--- FIX ADMIN USER END ---`);
}

fixAdminUser();
