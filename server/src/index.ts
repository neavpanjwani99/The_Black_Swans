import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import { aiRouter } from './routes/ai.js';


dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'DRISHTI AI Platform Backend'
  });
});

// Register AI Routes
app.use('/api/ai', aiRouter);

app.listen(PORT, () => {
  console.log(`[DRISHTI Server] Running on port ${PORT}`);
});
