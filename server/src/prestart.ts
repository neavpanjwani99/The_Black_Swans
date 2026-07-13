import dotenv from 'dotenv';
dotenv.config();

// Configure Zoho IN datacenter endpoints for India projects
process.env.X_ZOHO_CATALYST_ACCOUNTS_URL = 'https://accounts.zoho.in';
process.env.X_ZOHO_CATALYST_CONSOLE_URL = 'https://api.catalyst.zoho.in';
