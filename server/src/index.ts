import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import { aiRouter } from './routes/ai.js';
import { healthRouter } from './routes/health.js';

// config .env file ke chize li hui hai 
dotenv.config();

// variable ke ander express ke fucntions daale hai 
const app = express();
const PORT = process.env.PORT || 5000; // explicitly port 

app.use(cors()); // frontend and backend server saare connect karta hai 
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
