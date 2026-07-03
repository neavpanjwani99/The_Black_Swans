import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import Fir from './src/models/Fir.js';
import { ConvertToVector } from './src/utils/vector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || '';

async function seedData() {
  if (!MONGO_URI) {
    console.error('MONGO_URI is not defined.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const newFirs = [
    {
      fir_number: 'FIR-2026-9001',
      ps_name: 'Indiranagar Police Station',
      district: 'Bengaluru Urban',
      incident_date: new Date('2026-05-01T22:00:00Z'),
      registered_date: new Date('2026-05-02T08:00:00Z'),
      crime_type: 'Vehicle Theft',
      description: 'A blue Honda City was stolen from 100ft road. CCTV footage shows a suspect known as Shiva driving the vehicle away. The vehicle license plate is KA-05-MM-1234. Shiva was last seen contacting a broker on phone number +91-9876543210.',
      accused: [{ name: 'Shiva', gender: 'Male', age: 30 }],
    },
    {
      fir_number: 'FIR-2026-9002',
      ps_name: 'Koramangala Police Station',
      district: 'Bengaluru Urban',
      incident_date: new Date('2026-05-05T01:00:00Z'),
      registered_date: new Date('2026-05-05T09:00:00Z'),
      crime_type: 'Burglary',
      description: 'House break-in reported at 4th Block. The perpetrators used a white Maruti Swift, but witness reported seeing a blue Honda City, plate KA-05-MM-1234, scouting the area prior to the break-in. One of the suspects was identified as Ali Baig, who is a known broker for stolen goods. Ali Baig frequently uses the phone number +91-9876543210.',
      accused: [{ name: 'Ali Baig', gender: 'Male', age: 45 }],
    },
    {
      fir_number: 'FIR-2026-9003',
      ps_name: 'Whitefield Police Station',
      district: 'Bengaluru Urban',
      incident_date: new Date('2026-05-10T14:00:00Z'),
      registered_date: new Date('2026-05-10T18:00:00Z'),
      crime_type: 'Robbery',
      description: 'Mugging incident near ITPL. The attacker was identified as Shiva, fleeing the scene on a motorcycle. He was seen coordinating with another individual, later identified as Ali Baig, over the phone number +91-9876543210 to arrange a meetup point.',
      accused: [{ name: 'Shiva', gender: 'Male', age: 30 }, { name: 'Ali Baig', gender: 'Male', age: 45 }],
    },
    {
      fir_number: 'FIR-2026-9004',
      ps_name: 'Hebbal Police Station',
      district: 'Bengaluru Urban',
      incident_date: new Date('2026-06-01T22:30:00Z'),
      registered_date: new Date('2026-06-02T09:00:00Z'),
      crime_type: 'Extortion',
      description: 'Extortion attempt on a local businessman. The suspect, Ramesh Gowda, demanded protection money. He arrived in a black SUV with license plate KA-01-EE-9999. He left a contact number +91-8888888888 for the payment details.',
      accused: [{ name: 'Ramesh Gowda', gender: 'Male', age: 38 }],
    },
    {
      fir_number: 'FIR-2026-9005',
      ps_name: 'Yelahanka Police Station',
      district: 'Bengaluru Urban',
      incident_date: new Date('2026-06-15T19:00:00Z'),
      registered_date: new Date('2026-06-16T10:15:00Z'),
      crime_type: 'Arms Act',
      description: 'Illegal arms supply intercepted. The driver of a black SUV, license plate KA-01-EE-9999, was arrested. He was identified as Vikram Patil. His call logs showed multiple recent calls to +91-8888888888, which is registered to Ramesh Gowda.',
      accused: [{ name: 'Vikram Patil', gender: 'Male', age: 29 }],
    },
    {
      fir_number: 'FIR-2026-9006',
      ps_name: 'Malleswaram Police Station',
      district: 'Bengaluru Urban',
      incident_date: new Date('2026-06-20T14:45:00Z'),
      registered_date: new Date('2026-06-20T18:00:00Z'),
      crime_type: 'Kidnapping',
      description: 'Abduction of a minor. Witnesses saw two men, identified via CCTV as Ramesh Gowda and Vikram Patil, forcing the victim into a van. They later called the family for ransom using the phone number +91-8888888888.',
      accused: [{ name: 'Ramesh Gowda', gender: 'Male', age: 38 }, { name: 'Vikram Patil', gender: 'Male', age: 29 }],
    }
  ];

  for (let firData of newFirs) {
    const existing = await Fir.findOne({ fir_number: firData.fir_number });
    if (!existing) {
      console.log(`Embedding and inserting ${firData.fir_number}...`);
      const embedding = await ConvertToVector(firData.description);
      await Fir.create({ ...firData, embedding });
      console.log(`Inserted ${firData.fir_number}`);
    } else {
      console.log(`${firData.fir_number} already exists.`);
    }
  }

  console.log('Seed completed successfully.');
  mongoose.disconnect();
}

seedData().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
