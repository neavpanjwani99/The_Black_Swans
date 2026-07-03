import { Router } from 'express';
import { chatRouter } from './ai/chat.js';
import { ocrRouter } from './ai/ocr.js';
import { nerRouter } from './ai/ner.js';
import { forecastRouter } from './ai/forecast.js';
import { anomalyRouter } from './ai/anomaly.js';
import { documentRouter } from './ai/document.js';
import { similarityRouter } from './ai/similarity.js';
import { graphRouter } from './ai/graph.js';
import { exportPdfRouter } from './ai/export-pdf.js';

export const aiRouter = Router();

aiRouter.use('/chat', chatRouter);
aiRouter.use('/ocr', ocrRouter);
aiRouter.use('/ner', nerRouter);
aiRouter.use('/forecast', forecastRouter);
aiRouter.use('/anomaly', anomalyRouter);
aiRouter.use('/document', documentRouter);
aiRouter.use('/similarity', similarityRouter);
aiRouter.use('/graph', graphRouter);
aiRouter.use('/export-pdf', exportPdfRouter);
