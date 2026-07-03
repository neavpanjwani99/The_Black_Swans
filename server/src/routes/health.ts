import express from 'express';

export const healthRouter = express.Router();

// Basic health check route
healthRouter.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'DRISHTI AI Platform Backend'
  });
});
