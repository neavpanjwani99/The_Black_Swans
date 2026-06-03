const API_BASE_URL = 'http://localhost:5000/api/ai';

export interface ChatResponse {
  response: string;
  citations: Array<{ id: string; station: string; type: string; date: string }>;
}

export interface OcrResponse {
  status: string;
  language: string;
  confidence: number;
  extractedFields: {
    firNumber: string;
    dateFiled: string;
    accusedName: string;
    crimeType: string;
    location: string;
  };
  rawText: string;
}

export interface Entity {
  text: string;
  category: string;
  start: number;
  end: number;
}

export interface NerResponse {
  entities: Entity[];
}

export interface ForecastItem {
  crimeType: string;
  riskLevel: 'HIGH' | 'MODERATE' | 'LOW';
  increasePercentage: number;
  peakWindow: string;
  hotLocations: string[];
  confidence: number;
}

export interface ForecastResponse {
  district: string;
  forecastWindowDays: number;
  predictions: ForecastItem[];
}

export interface AnomalyAlert {
  id: string;
  timestamp: string;
  station: string;
  crimeType: string;
  firCountLast3Hours: number;
  historicalAverage: number;
  deviationPercentage: number;
  suggestedAction: string;
  evidenceFirs: string[];
  confidence: number;
  acknowledged: boolean;
}

export interface AnomalyResponse {
  alerts: AnomalyAlert[];
}

export interface DocumentResponse {
  documentType: string;
  extractedFields: {
    bank: string;
    branch: string;
    accountName: string;
    accountNumber: string;
    ifsc: string;
  };
  flaggedTransactions: Array<{ date: string; type: string; amount: number; sender: string }>;
  riskPatternFlag: string;
}

export interface SimilarityMatch {
  firId: string;
  station: string;
  date: string;
  similarityScore: number;
  commonFactors: string[];
}

export interface SimilarityResponse {
  matches: SimilarityMatch[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'PERSON' | 'PHONE' | 'VEHICLE' | 'CASE';
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export interface GraphResponse {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface ExportPdfResponse {
  status: string;
  downloadUrl: string;
  generatedAt: string;
}

export const api = {
  async chat(message: string, history: Array<{ sender: 'user' | 'ai'; text: string }>): Promise<ChatResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history })
      });
      return await res.json();
    } catch (e) {
      console.warn('API call failed, returning mock data', e);
      return {
        response: `[Offline Mode] Unable to connect to backend. This is local fallback for query: "${message}"`,
        citations: [
          { id: 'FIR-1023/2024', station: 'Banaswadi PS', type: 'Robbery', date: '2024-01-15' }
        ]
      };
    }
  },

  async runOcr(file?: File): Promise<OcrResponse> {
    try {
      if (file) console.log('Processing OCR file:', file.name);
      const res = await fetch(`${API_BASE_URL}/ocr`, { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.warn('API call failed, returning mock data', e);
      return {
        status: 'success',
        language: 'Kannada + English (mixed)',
        confidence: 0.942,
        extractedFields: {
          firNumber: '0234/2019',
          dateFiled: '2019-03-14',
          accusedName: 'Raju Kumar',
          crimeType: 'Theft under IPC 379',
          location: 'Near Bus Stand, Gulbarga'
        },
        rawText: 'FIR No. 0234/2019, Gulbarga Police Station... આરોપી/ಆರೋಪಿ: ರಾಜು ಕುಮಾರ್ (Raju Kumar)...'
      };
    }
  },

  async runNer(text: string): Promise<NerResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/ner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      return await res.json();
    } catch (e) {
      console.warn('API call failed, returning mock data', e);
      return {
        entities: [
          { text: 'Raju Kumar', category: 'PERSON', start: 22, end: 32 },
          { text: 'Koramangala flyover', category: 'LOCATION', start: 69, end: 88 }
        ]
      };
    }
  },

  async getForecast(): Promise<ForecastResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/forecast`);
      return await res.json();
    } catch (e) {
      console.warn('API call failed, returning mock data', e);
      return {
        district: 'Bangalore East (Offline)',
        forecastWindowDays: 7,
        predictions: [
          { crimeType: 'Chain Snatching', riskLevel: 'HIGH', increasePercentage: 210, peakWindow: '18:00 - 21:00', hotLocations: ['MG Road', 'Brigade Road'], confidence: 0.87 }
        ]
      };
    }
  },

  async getAnomaly(): Promise<AnomalyResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/anomaly`);
      return await res.json();
    } catch (e) {
      console.warn('API call failed, returning mock data', e);
      return {
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
      };
    }
  },

  async scanDocument(file?: File): Promise<DocumentResponse> {
    try {
      if (file) console.log('Scanning document file:', file.name);
      const res = await fetch(`${API_BASE_URL}/document`, { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.warn('API call failed, returning mock data', e);
      return {
        documentType: 'Bank Passbook',
        extractedFields: {
          bank: 'Canara Bank',
          branch: 'Rajajinagar Branch',
          accountName: 'Suresh Kumar',
          accountNumber: 'XXXX XXXX 4521',
          ifsc: 'CNRB0001234'
        },
        flaggedTransactions: [
          { date: '2024-01-14', type: 'CREDIT', amount: 85000, sender: 'Unidentified' }
        ],
        riskPatternFlag: 'Large cash withdrawal within 48 hours of credit.'
      };
    }
  },

  async getSimilarity(firDetails: string): Promise<SimilarityResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/similarity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firDetails })
      });
      return await res.json();
    } catch (e) {
      console.warn('API call failed, returning mock data', e);
      return {
        matches: [
          { firId: 'FIR-5698', station: 'Domlur PS', date: '3 days ago', similarityScore: 0.91, commonFactors: ['Sunday morning entry', 'Ground floor toilet window'] }
        ]
      };
    }
  },

  async getGraph(): Promise<GraphResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/graph`);
      return await res.json();
    } catch (e) {
      console.warn('API call failed, returning mock data', e);
      return {
        nodes: [
          { id: 'Shiva', label: 'Shiva (Accused)', type: 'PERSON', risk: 'HIGH' },
          { id: 'Ali Baig', label: 'Ali Baig (Broker)', type: 'PERSON', risk: 'HIGH' }
        ],
        links: [
          { source: 'Shiva', target: 'Ali Baig', type: 'SHARED_PHONE' }
        ]
      };
    }
  },

  async exportPdf(chatId: string): Promise<ExportPdfResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId })
      });
      return await res.json();
    } catch (e) {
      console.warn('API call failed, returning mock data', e);
      return {
        status: 'success',
        downloadUrl: '#',
        generatedAt: new Date().toISOString()
      };
    }
  }
};
