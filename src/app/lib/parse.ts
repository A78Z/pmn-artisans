import Parse from 'parse/node';

const appId = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
const jsKey = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;
const serverUrl = process.env.NEXT_PUBLIC_PARSE_SERVER_URL;
const masterKey = process.env.PARSE_MASTER_KEY;

if (!appId || !jsKey || !serverUrl) {
    console.warn('Back4App credentials missing in environment variables');
}

// Basic storage mock for Node.js - STRICTLY NO-OP to prevent session pollution
if (typeof window === 'undefined') {
    const MockStorage = {
        getItem: () => null,
        setItem: (_key: string, _value: any) => { }, // Do not store anything
        removeItem: () => { },
        clear: () => { }
    };
    (global as any).localStorage = MockStorage;
}

// Global Singleton Pattern to prevent HMR issues in Next.js
const globalForParse = global as unknown as { parseInitialized: boolean };

export const ensureParseInitialized = async () => {
    // 1. Check if already initialized, BUT re-assert configuration to be safe
    if (globalForParse.parseInitialized && Parse.applicationId) {
        // Re-apply critical settings in case they were lost or init was weak (e.g. via Auth without MasterKey)
        if (serverUrl) Parse.serverURL = serverUrl;
        if (masterKey) (Parse as any).masterKey = masterKey;
        return;
    }

    // 2. Check if Parse singleton has ID (side-loaded) - Re-assert here too
    if (Parse.applicationId) {
        globalForParse.parseInitialized = true;
        if (serverUrl) Parse.serverURL = serverUrl;
        if (masterKey) (Parse as any).masterKey = masterKey;
        return;
    }

    // 3. Init
    if (!appId || !jsKey || !serverUrl) {
        // Silently return (or throw?) - failing here causes 500
        // Better to throw so we can catch it in the Action
        console.error("[Parse] Credentials MISSING. Check .env");
        throw new Error("Back4App credentials missing in environment variables.");
    }

    try {
        // @ts-ignore
        Parse.initialize(appId, jsKey, masterKey); // Pass MasterKey as 3rd arg
        Parse.serverURL = serverUrl;

        // Ensure MasterKey is really usable
        if (masterKey) {
            (Parse as any).masterKey = masterKey;
        }

        globalForParse.parseInitialized = true;
        console.log(`[Parse] Initialized successfully. MasterKey available: ${!!masterKey}`);
    } catch (e) {
        console.error("[Parse] Initialization FAILED:", e);
        throw e;
    }
};

// Auto-init on module load (Best effort)
if (!globalForParse.parseInitialized) {
    if (appId && jsKey && serverUrl) {
        try {
            // @ts-ignore
            Parse.initialize(appId, jsKey, masterKey);
            Parse.serverURL = serverUrl;
            globalForParse.parseInitialized = true;
            console.log(`[Parse] Auto-Initialized. MasterKey provided: ${!!masterKey}`);
        } catch (e) {
            console.warn("[Parse] Auto-init failed, will retry on demand.", e);
        }
    }
}

export default Parse;
