'use strict';

const express = require('express');
const cors = require('cors');
const { verifyRbac } = require('./src/middleware/rbac');
const { authRouter } = require('./src/routes/authRoutes');
const { aiRouter } = require('./src/routes/aiRoutes');

const app = express();

// Configure CORS for web client access
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-badge-number']
}));

// Express Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'drishti_function',
    type: 'AdvancedIO',
    timestamp: new Date().toISOString()
  });
});

app.get("/test", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Hello from the backend",
  });
});

// Auth Routes (Mounted under /server/drishti_function/api/auth, /api/auth, /auth)
app.use(['/server/drishti_function/api/auth', '/server/drishti_function/auth', '/api/auth', '/auth'], authRouter);

// AI & Intelligence Routes (Mounted under /server/drishti_function/api/ai, /api/ai and direct paths)
app.use(['/server/drishti_function/api/ai', '/server/drishti_function/ai', '/server/drishti_function', '/api/ai', '/ai', '/'], verifyRbac, aiRouter);

/**
 * Zoho Catalyst AdvancedIO Entrypoint Handler
 * Accepts Node.js (req, res) and forwards to the Express app.
 */
module.exports = (req, res) => {
  app(req, res);
};
