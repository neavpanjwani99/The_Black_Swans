import { Router } from 'express';
import { aiController } from '../controllers/aiController';
import { verifyRbac } from '../middleware/rbac';

export const aiRouter = Router();

// Secure all intelligence routes using Role-Based Access Control
aiRouter.use(verifyRbac);

// Route declarations (calling pure controller handlers)
aiRouter.post('/chat', aiController.chat);
aiRouter.post('/ocr', aiController.ocr);
aiRouter.post('/ner', aiController.ner);
aiRouter.get('/forecast', aiController.forecast);
aiRouter.get('/anomaly', aiController.anomaly);
aiRouter.post('/document', aiController.document);
aiRouter.post('/similarity', aiController.similarity);
aiRouter.get('/graph', aiController.graph);
aiRouter.post('/export-pdf', aiController.exportPdf);
aiRouter.get('/download-pdf/:id', aiController.downloadPdf);
