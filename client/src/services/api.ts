const API_BASE_URL = 'http://localhost:5000/api/ai';

const getHeaders = (extraHeaders: Record<string, string> = {}) => {
  const saved = sessionStorage.getItem('drishti_user');
  let authHeaders: Record<string, string> = {};
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      authHeaders = {
        'x-user-role': parsed.role || '',
        'x-badge-number': parsed.badgeNumber || ''
      };
    } catch (e) {
      // ignore
    }
  }
  return {
    ...authHeaders,
    ...extraHeaders
  };
};


export interface ChatResponse {
  response: string;
  citations: Array<{ id: string; station: string; type: string; date: string }>;
}

export interface OcrResponse {
  status: string;
  message?: string;
  language: string;
  confidence: number;
  extractedFields: {
    fir_number: string | null;
    ps_name: string | null;
    district: string | null;
    incident_date: string | null;
    registered_date: string | null;
    crime_type: string | null;
    ipc_sections: string[];
    description: string;
    accused: Array<{ name: string; age: number; gender: string; address: string }>;
    victim: Array<{ name: string; age: number; gender: string }>;
    location: string | null;
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
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ message, history })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || json;
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

  async runOcr(text: string, confidence: number): Promise<OcrResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/ocr`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ text, confidence })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || json;
    } catch (e) {
      console.warn('API call failed, returning mock data', e);
      return {
        status: 'success',
        message: 'OCR Extraction Complete (Fallback)',
        language: 'Kannada + English (mixed)',
        confidence: confidence || 0.942,
        extractedFields: {
          fir_number: '0234/2019',
          ps_name: 'Gulbarga Police Station',
          district: 'Gulbarga',
          incident_date: '2019-03-14',
          registered_date: '2019-03-14',
          crime_type: 'Theft',
          ipc_sections: ['379'],
          description: 'A theft incident occurred near the bus stand.',
          accused: [{ name: 'Raju Kumar', age: 30, gender: 'Male', address: 'Unknown' }],
          victim: [],
          location: 'Near Bus Stand, Gulbarga'
        },
        rawText: text || 'FIR No. 0234/2019, Gulbarga Police Station... आरोपी/ಆರೋಪಿ: ರಾಜು ಕುಮಾರ್ (Raju Kumar)...'
      };
    }
  },

  async runNer(text: string): Promise<NerResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/ner`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || json;
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
      const res = await fetch(`${API_BASE_URL}/forecast`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || json;
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
      const res = await fetch(`${API_BASE_URL}/anomaly`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || json;
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

  async scanDocument(text: string): Promise<DocumentResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/document`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || json;
    } catch (e) {
      console.warn('API call failed, returning mock data', e);
      return {
        documentType: 'Bank Passbook (Fallback)',
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
      };
    }
  },

  async getSimilarity(firDetails: string): Promise<SimilarityResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/similarity`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ firDetails })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || json;
    } catch (e) {
      console.warn('API call failed, returning mock data', e);
      return {
        matches: [
          { firId: 'FIR-5698', station: 'Domlur PS', date: '3 days ago', similarityScore: 0.91, commonFactors: ['Sunday morning entry', 'Ground floor toilet window'] }
        ]
      };
    }
  },

  async getGraph(query?: string): Promise<GraphResponse> {
    try {
      const url = query ? `${API_BASE_URL}/graph?q=${encodeURIComponent(query)}` : `${API_BASE_URL}/graph`;
      const res = await fetch(url, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || json;
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
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ chatId })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || json;
    } catch (e) {
      console.warn('API call failed, returning mock data', e);
      return {
        status: 'success',
        downloadUrl: '#',
        generatedAt: new Date().toISOString()
      };
    }
  },

  async login(badgeNumber: string, accessPin: string): Promise<{ success: boolean; message?: string; user?: { name: string; badgeNumber: string; role: string; station: string } }> {
    try {
      // NOTE: When backend authentication is ready, simply uncomment the block below:
      /*
      const res = await fetch(`${API_BASE_URL.replace('/ai', '')}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeNumber, accessPin })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || json;
      */

      // Dynamic Mock logic simulating backend authentication check:
      const credentials: Record<string, { name: string; role: string; station: string }> = {
        'KSP-7482': { name: 'Inspector Verma', role: 'Investigator', station: 'Banaswadi PS' },
        'KSP-9921': { name: 'Analyst Priya', role: 'Analyst', station: 'HQ Crime Intelligence Section' },
        'KSP-1042': { name: 'ACP Gowda', role: 'Supervisor', station: 'East Division Bengaluru' },
        'KSP-2030': { name: 'SCRB Director Rao', role: 'Policymaker', station: 'State Crime Records Bureau' }
      };

      const matchedUser = credentials[badgeNumber.trim()];
      if (matchedUser && accessPin === 'password') {
        return {
          success: true,
          user: {
            name: matchedUser.name,
            badgeNumber: badgeNumber.trim(),
            role: matchedUser.role,
            station: matchedUser.station
          }
        };
      }
      return {
        success: false,
        message: 'Invalid Badge Number or Access PIN. Use KSP-7482, KSP-9921, KSP-1042, or KSP-2030 with password.'
      };
    } catch (e) {
      console.warn('Authentication API call failed, returning fallback mock data', e);
      return {
        success: false,
        message: 'Authentication server connection failed.'
      };
    }
  }
};
