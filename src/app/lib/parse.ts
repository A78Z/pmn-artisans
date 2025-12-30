import Parse from 'parse/node';

const appId = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
const jsKey = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;
const serverUrl = process.env.NEXT_PUBLIC_PARSE_SERVER_URL;
const masterKey = process.env.PARSE_MASTER_KEY;

if (!appId || !jsKey || !serverUrl) {
    console.warn('Back4App credentials missing in environment variables');
}

// Basic storage mock for Node.js
if (typeof window === 'undefined') {
    const MockStorage = {
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { },
        clear: () => { }
    };
    (global as any).localStorage = MockStorage;
}

// Global Singleton Pattern to prevent HMR issues in Next.js
const globalForParse = global as unknown as { parseInitialized: boolean };

export const ensureParseInitialized = async () => {
    // If we are already initialized in this process, skip
    if (globalForParse.parseInitialized && Parse.applicationId) {
        return;
    }

    if (Parse.applicationId) {
        globalForParse.parseInitialized = true;
        return;
    }

    if (!appId || !jsKey || !serverUrl) {
        // Only throw if we strictly need it and it's missing
        throw new Error("Back4App credentials missing - Parse cannot be initialized!");
    }

    // @ts-ignore
    Parse.initialize(appId, jsKey, masterKey);
    Parse.serverURL = serverUrl;
    globalForParse.parseInitialized = true;
};

// Auto-init on module load if possible, but safely
if (!globalForParse.parseInitialized) {
    if (appId && jsKey && serverUrl) {
        // @ts-ignore
        Parse.initialize(appId, jsKey, masterKey);
        Parse.serverURL = serverUrl;
        globalForParse.parseInitialized = true;
    }
}

export default Parse;
