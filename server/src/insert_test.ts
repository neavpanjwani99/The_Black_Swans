import dotenv from 'dotenv';
import { dbService } from './utils/dbService';

// Load .env
dotenv.config();

console.log("Fetching and printing all rows from Zoho Catalyst Cloud Data Store...");

async function run() {
  try {
    const rows = await dbService.getRows('Firs');
    console.log(`\n✅ Successfully fetched ${rows.length} rows from Firs table!`);
    console.log("\nDatabase Data:");
    console.log(JSON.stringify(rows, null, 2));
  } catch (error: any) {
    console.error("Error occurred:", error);
  }
}

run();
