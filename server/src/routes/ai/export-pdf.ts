import { Router } from 'express';

export const exportPdfRouter = Router();

exportPdfRouter.post('/', (req, res) => {
  res.json({
    status: 'success',
    downloadUrl: 'https://catalyst.zoho.com/smartbrowz/placeholder-briefing.pdf',
    generatedAt: new Date().toISOString()
  });
});
