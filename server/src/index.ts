import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import { aiRouter } from './routes/ai.js';
import { healthRouter } from './routes/health.js';


dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check route
app.use('/api/health', healthRouter);

// Register AI Routes
app.use('/api/ai', aiRouter);

const c= connectDB(); 
if(c instanceof Promise) {
  console.log('[DRISHTI Server] Connected to MongoDB');
}

app.listen(PORT, () => {
  console.log(`[DRISHTI Server] Running on port ${PORT}`);
});
