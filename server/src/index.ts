import './prestart';
// Triggering dev server reload after updating project key in .env
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { aiRouter } from './routes/ai';
import { errorHandler } from './middleware/errorHandler';
import { dbService } from './utils/dbService';

// Initialize environment variables from .env if present

console.log("process.env.NODE_ENV", process.env.CATALYST_CLIENT_ID)

const app = express();

// Configure CORS to allow frontend communication
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-badge-number']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Register routers
app.use('/api/auth', authRouter);
app.use('/api/ai', aiRouter);

dbService.getRows("Firs")
  .then(result => {
    console.log("✅ Startup test query success (all rows from cloud):", result);
  })
  .catch(err => {
    console.error("❌ Startup test query failed:",  err);
  });

// Register error handler
app.use(errorHandler);

// Bind to Zoho Catalyst AppSail designated port or port 5000 for local development
const PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT || 5000;

app.listen(PORT, () => {
  console.log(` Listening on port: http://localhost:${PORT}`);
  dbService.testConnection(); // Test database connection on startup
});

export default app;
