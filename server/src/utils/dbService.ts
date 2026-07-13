// Configure Zoho IN datacenter endpoints for India projects BEFORE requiring the SDK
process.env.X_ZOHO_CATALYST_ACCOUNTS_URL = 'https://accounts.zoho.in';
process.env.X_ZOHO_CATALYST_CONSOLE_URL = 'https://api.catalyst.zoho.in';

const catalyst = require('zcatalyst-sdk-node');

export const dbService = {
  getCatalystApp(req?: any): any {
    try {
      // Check if Catalyst app is already initialized to avoid "The app already exists" error
      try {
        const app = catalyst.app();
        if (app) return app;
      } catch (e) {
        // App not initialized yet, proceed
      }

      // 1. AppSail / Catalyst CLI Mode:
      // If request has headers (provided by Zoho gateway or catalyst serve), initialize natively
      if (req && (req.headers || req.catalystHeaders)) {
        return catalyst.initialize(req);
      }

      // 2. Standalone / Local development mode:
      const hasCredentials = 
        process.env.CATALYST_REFRESH_TOKEN && 
        process.env.CATALYST_CLIENT_ID && 
        process.env.CATALYST_CLIENT_SECRET;

      if (hasCredentials) {
        const credentials = {
          refresh_token: process.env.CATALYST_REFRESH_TOKEN!,
          client_id: process.env.CATALYST_CLIENT_ID!,
          client_secret: process.env.CATALYST_CLIENT_SECRET!,
        };
        const CatalystCred = catalyst.credential.refreshToken(credentials);

        const fakeReq: any = req || {};
        fakeReq.project_id = process.env.CATALYST_PROJECT_ID!;
        fakeReq.project_key = process.env.CATALYST_PROJECT_KEY || '50043876351';
        fakeReq.environment = process.env.CATALYST_ENV || 'Development';
        fakeReq.credential = CatalystCred;

        return catalyst.initializeApp(fakeReq);
      }

      // Fallback if no credentials in .env (relies on default credential file)
      const defaultReq: any = req || {};
      defaultReq.project_id = process.env.CATALYST_PROJECT_ID || '56039000000020001';
      defaultReq.project_key = process.env.CATALYST_PROJECT_KEY || '50043876351';
      defaultReq.environment = process.env.CATALYST_ENV || 'Development';
      return catalyst.initializeApp(defaultReq);
      
    } catch (error) {
      console.error("❌ Catalyst SDK Initialization Error:", error);
      return null;
    }
  },

  testConnection() {
    try {
      const app = this.getCatalystApp();
      if (app) {
        console.log("✅ Database (Catalyst Data Store) connected successfully.");
        return true;
      }
      console.error("❌ Database (Catalyst Data Store) failed to connect.");
      return false;
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      return false;
    }
  },

  async executeZQL(query: string, req?: any) {
    const app = this.getCatalystApp(req);
    if (!app) throw new Error("Catalyst app initialization failed.");
    const zcql = app.zcql();
    return await zcql.executeZCQLQuery(query || "SELECT * FROM FIRS");
  },

  async insertRow(tableName: string, row: any, req?: any) {
    const app = this.getCatalystApp(req);
    if (!app) throw new Error("Catalyst app initialization failed.");
    const table = app.datastore().table(tableName);
    return await table.insertRow(row);
  },

  async getRows(tableName: string, req?: any) {
    const app = this.getCatalystApp(req);
    if (!app) throw new Error("Catalyst app initialization failed.");
    const table = app.datastore().table(tableName);
    const result = await table.getPagedRows();
    return result.data || [];
  }
};