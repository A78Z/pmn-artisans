import dotenv from 'dotenv';
dotenv.config();

const appId = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
// Master Key provided by user
const masterKey = "QzBMqnvazuNP4tf9XtFGptva9w6a1gIDuywm7HY0";
const serverUrl = process.env.NEXT_PUBLIC_PARSE_SERVER_URL || "https://parseapi.back4app.com";

if (!appId || !masterKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const targetEmail = "syllaharouna740@gmail.com";
const desiredPassword = "Admin@2025";

async function forceUpdate() {
    console.log(`Searching for user ${targetEmail} using Master Key...`);

    // 1. Find User by Email (using Master Key allows this)
    const findUrl = `${serverUrl}/users?where=${encodeURIComponent(JSON.stringify({ email: targetEmail }))}`;

    try {
        const findRes = await fetch(findUrl, {
            headers: {
                'X-Parse-Application-Id': appId!,
                'X-Parse-Master-Key': masterKey,
                'Content-Type': 'application/json'
            }
        });

        const findData = await findRes.json();

        if (!findRes.ok) {
            console.error("Error finding user:", findData);
            return;
        }

        if (findData.results && findData.results.length > 0) {
            const user = findData.results[0];
            console.log(`User found (ID: ${user.objectId}). Updating password and role...`);

            // 2. Update User (Master Key allows overriding everything)
            const updateUrl = `${serverUrl}/users/${user.objectId}`;
            const updateRes = await fetch(updateUrl, {
                method: 'PUT',
                headers: {
                    'X-Parse-Application-Id': appId!,
                    'X-Parse-Master-Key': masterKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: desiredPassword,
                    role: 'super_admin',
                    emailVerified: true // Ensure email is verified just in case
                })
            });

            const updateData = await updateRes.json();

            if (updateRes.ok) {
                console.log("SUCCESS: User updated successfully!");
                console.log(`Email: ${targetEmail}`);
                console.log(`Password: ${desiredPassword}`);
                console.log(`Role: super_admin`);
            } else {
                console.error("Failed to update user:", updateData);
            }

        } else {
            console.log("User not found. Creating new super_admin user...");

            // 3. Create User if not exists
            const createUrl = `${serverUrl}/users`;
            const createRes = await fetch(createUrl, {
                method: 'POST',
                headers: {
                    'X-Parse-Application-Id': appId!,
                    'X-Parse-Master-Key': masterKey, // Master Key creates user without open registration issues
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: targetEmail,
                    username: targetEmail,
                    password: desiredPassword,
                    role: 'super_admin',
                    nom: 'Admin',
                    prenom: 'System',
                    emailVerified: true
                })
            });

            const createData = await createRes.json();

            if (createRes.ok) {
                console.log("SUCCESS: New Admin User created!");
            } else {
                console.error("Failed to create user:", createData);
            }
        }

    } catch (e: any) {
        console.error("Script Error:", e);
    }
}

forceUpdate();
