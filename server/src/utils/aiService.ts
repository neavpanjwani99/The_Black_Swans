import catalyst from 'zcatalyst-sdk-node';

/**
 * Zia Services OCR Integration
 */
export const ocrService = {
  /**
   * Scans a file buffer using Zia OCR and returns the text
   */
  async scanFirOcr(fileStream: any, req: any): Promise<string> {
    const catalystApp = catalyst.initialize(req);
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
    const catalystApp = catalyst.initialize(req);
    const zia = catalystApp.zia() as any;

    // Call QuickML endpoint deployed in Catalyst Console
    const pipelineId = "YOUR_QUICKML_PIPELINE_ID";
    const payload = {
      user_query: query,
      database_context: context
    };

    const result = await zia.executeQuickMLEndpoint(pipelineId, payload);
    return result.response_text;
  }
};
