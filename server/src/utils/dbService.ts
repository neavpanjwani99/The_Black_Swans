import catalyst from 'zcatalyst-sdk-node';


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

      // Configure Zoho IN datacenter endpoints for India projects
      if (!process.env.X_ZOHO_CATALYST_ACCOUNTS_URL) {
        process.env.X_ZOHO_CATALYST_ACCOUNTS_URL = 'https://accounts.zoho.in';
      }
      if (!process.env.X_ZOHO_CATALYST_CONSOLE_URL) {
        process.env.X_ZOHO_CATALYST_CONSOLE_URL = 'https://api.catalyst.zoho.in';
      }

      const credentials = {
        refresh_token: process.env.CATALYST_REFRESH_TOKEN!,
        client_id: process.env.CATALYST_CLIENT_ID!,
        client_secret: process.env.CATALYST_CLIENT_SECRET!,
      };
      const CatalystCred = catalyst.credential.refreshToken(credentials);

      const fakeReq: any = req || {};
      fakeReq.project_id = process.env.CATALYST_PROJECT_ID!;
      fakeReq.project_key = process.env.CATALYST_PROJECT_KEY || 'dummy_project_key'; // Avoid validator "Not a number type" error
      fakeReq.environment = process.env.CATALYST_ENV || 'Development';
      fakeReq.credential = CatalystCred;

      return catalyst.initializeApp(fakeReq);
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
  }
};