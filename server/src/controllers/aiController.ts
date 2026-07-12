import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export const aiController = {
  
  //Conversational Chat Endpoint (returns mock response matching client expectations)
  chat: asyncHandler(async (req, res) => {
    const { message } = req.body;
    return res.status(200).json(new ApiResponse(200, {
      response: `[Mock Server Response] Received: "${message}". This is a simulated backend response.`,
      citations: [
        { id: 'FIR-1023/2024', station: 'Banaswadi PS', type: 'Robbery', date: '2024-01-15' }
      ]
    }, 'Success'));
  }),

  
  //OCR Processing Endpoint (returns structured mock OCR fields)
  ocr: asyncHandler(async (req, res) => {
    const { text } = req.body;
    return res.status(200).json(new ApiResponse(200, {
      status: 'success',
      language: 'Kannada + English (mixed)',
      confidence: 0.942,
      extractedFields: {
        fir_number: '0234/2019',
        ps_name: 'Gulbarga Police Station',
        district: 'Gulbarga',
        incident_date: '2019-03-14',
        registered_date: '2019-03-14',
        crime_type: 'Theft',
        ipc_sections: ['379'],
        description: text || 'A theft incident occurred near the bus stand.',
        accused: [{ name: 'Raju Kumar', age: 30, gender: 'Male', address: 'Unknown' }],
        victim: [],
        location: 'Near Bus Stand, Gulbarga'
      },
      rawText: text || ''
    }, 'OCR Extraction Complete (Simulated)'));
  }),

  
  //Named Entity Recognition Endpoint
  ner: asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, {
      entities: [
        { text: 'Raju Kumar', category: 'PERSON', start: 22, end: 32 },
        { text: 'Koramangala flyover', category: 'LOCATION', start: 69, end: 88 }
      ]
    }, 'Success'));
  }),

 
   // Crime Risk Forecast Endpoint
  forecast: asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, {
      district: 'Bangalore East (Mock Server)',
      forecastWindowDays: 7,
      predictions: [
        {
          crimeType: 'Chain Snatching',
          riskLevel: 'HIGH',
          increasePercentage: 210,
          peakWindow: '18:00 - 21:00',
          hotLocations: ['MG Road', 'Brigade Road'],
          confidence: 0.87
        }
      ]
    }, 'Success'));
  }),

  
  //Real-time Anomaly Alerts Endpoint

  anomaly: asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, {
      alerts: [
        {
          id: 'AL-90823',
          timestamp: new Date().toISOString(),
          station: 'Hebbal PS',
          crimeType: 'Vehicle Theft',
          firCountLast3Hours: 9,
          historicalAverage: 2,
          deviationPercentage: 350,
          suggestedAction: 'Check NH-44 service road CCTV cameras.',
          evidenceFirs: ['FIR-5601', 'FIR-5602'],
          confidence: 0.91,
          acknowledged: false
        }
      ]
    }, 'Success'));
  }),

  /**
   * Financial Document Passbook AI Parser Endpoint
   */
  document: asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, {
      documentType: 'Bank Passbook (Simulated)',
      extractedFields: {
        bank: 'Canara Bank',
        branch: 'Rajajinagar Branch',
        accountName: 'Suresh Kumar',
        accountNumber: 'XXXX XXXX 4521',
        ifsc: 'CNRB0001234'
      },
      flaggedTransactions: [
        { date: '2024-01-14', type: 'CREDIT', amount: 85000, sender: 'Unidentified' },
        { date: '2024-02-03', type: 'CREDIT', amount: 120000, sender: 'Unidentified' },
        { date: '2024-02-05', type: 'DEBIT', amount: 205000, sender: 'Cash Withdrawal' }
      ],
      riskPatternFlag: 'Large cash withdrawal within 48 hours of credit. Flagged for manual review.'
    }, 'Success'));
  }),

  /**
   * Case Similarity Search Endpoint
   */
  similarity: asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, {
      matches: [
        {
          firId: 'FIR-5698',
          station: 'Domlur PS',
          date: '3 days ago',
          similarityScore: 0.91,
          commonFactors: ['Sunday morning entry', 'Ground floor toilet window']
        }
      ]
    }, 'Success'));
  }),

  /**
   * Relationship Link Graph Endpoint
   */
  graph: asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, {
      nodes: [
        { id: 'Shiva', label: 'Shiva (Accused)', type: 'PERSON', risk: 'HIGH' },
        { id: 'Ali Baig', label: 'Ali Baig (Broker)', type: 'PERSON', risk: 'HIGH' }
      ],
      links: [
        { source: 'Shiva', target: 'Ali Baig', type: 'SHARED_PHONE' }
      ]
    }, 'Success'));
  }),

  /**
   * PDF Export Briefing Endpoint
   */
  exportPdf: asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, {
      status: 'success',
      downloadUrl: '#',
      generatedAt: new Date().toISOString()
    }, 'Success'));
  }),

  /**
   * PDF Download Endpoint
   */
  downloadPdf: asyncHandler(async (req, res) => {
    return res.status(200).send('Simulated PDF Download File');
  })
};
