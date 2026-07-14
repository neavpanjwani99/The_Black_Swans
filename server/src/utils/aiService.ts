import { dbService } from './dbService';

/**
 * Zia Services OCR Integration
 */
export const ocrService = {
  /**
   * Scans a file buffer using Zia OCR and returns the text
   */
  async scanFirOcr(fileStream: any, req: any): Promise<string> {
    const catalystApp = dbService.getCatalystApp(req);
    const zia = catalystApp.zia() as any;

    // Call native Catalyst Zia OCR API
    const response = await zia.extractOpticalCharacter(fileStream);
    return response.text || '';
  }
};

/**
 * QuickML RAG Pipeline Completion
 */
export const quickMlService = {
  /**
   * Sends user query to the Catalyst QuickML RAG endpoint
   */
  async askDrishtiAi(query: string, context: string, req: any): Promise<string> {
    const catalystApp = dbService.getCatalystApp(req);
    const quickml = catalystApp.quickML();

    // Call QuickML endpoint deployed in Catalyst Console
    const pipelineId = "56039000000020001";
    const payload = {
      user_query: query,
      database_context: context
    };

    const result = await quickml.predict(pipelineId, payload);
    return result.result && result.result.length > 0 ? result.result[0] : "";
  }
};
