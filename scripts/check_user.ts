import dotenv from 'dotenv';
dotenv.config();

const appId = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
const restKey = "m4II0xOLXGGLx0WJEyhFOqDBJp3qUVa5oLa34pHf";
const serverUrl = process.env.NEXT_PUBLIC_PARSE_SERVER_URL || "https://parseapi.back4app.com";

const targetEmail = "syllaharouna740@gmail.com";
const targetPassword = "Admin@2025";

async function checkUser() {
    console.log(`--- DIAGNOSTIC START ---`);
    console.log(`Checking user: [${targetEmail}]`);

    try {
        // 1. Check User Data
        const query = encodeURIComponent(JSON.stringify({ email: targetEmail }));
        const checkUrl = `${serverUrl}/users?where=${query}`;

        const checkRes = await fetch(checkUrl, {
            headers: {
                'X-Parse-Application-Id': appId!,
                'X-Parse-REST-API-Key': restKey
            }
        });

        const checkData = await checkRes.json();

        if (checkData.results && checkData.results.length > 0) {
            const user = checkData.results[0];
            console.log(`User FOUND.`);
            console.log(`ObjectId: ${user.objectId}`);
            console.log(`Username: '${user.username}'`);
            console.log(`Email:    '${user.email}'`);
            console.log(`Role:     '${user.role}'`);
            console.log(`Status:   '${user.status}'`);

            if (user.role !== 'admin' && user.role !== 'super_admin') {
                console.error("❌ ROLE ISSUE: User is not 'admin' or 'super_admin'. Login will be blocked.");
            } else {
                console.log("✅ Role is valid.");
            }

        } else {
            console.error("❌ User NOT FOUND by email.");
        }

        // 2. Test Password Login
        console.log(`Testing Login with password: '${targetPassword}'...`);
        const loginUrl = `${serverUrl}/login?username=${encodeURIComponent(targetEmail)}&password=${encodeURIComponent(targetPassword)}`;
        const loginRes = await fetch(loginUrl, {
            headers: {
                'X-Parse-Application-Id': appId!,
                'X-Parse-REST-API-Key': restKey,
                'X-Parse-Revocable-Session': '1'
            }
        });

        const loginData = await loginRes.json();

        if (loginRes.ok) {
            console.log("✅ LOGIN SUCCESS via REST API.");
            console.log("Session Token received.");
            console.log("Login Response Keys:", Object.keys(loginData));
            console.log("Role in Login Data:", loginData.role);
            console.log("ACL in Login Data:", loginData.ACL);
        } else {
            console.error("❌ LOGIN FAILED via REST API.");
            console.error("Error:", loginData);
        }

    } catch (e) {
        console.error("Script Error:", e);
    }
    console.log(`--- DIAGNOSTIC END ---`);
}

checkUser();
