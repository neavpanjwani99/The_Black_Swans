import Groq from 'groq-sdk';
import { Router } from 'express';
import { ConvertToVector } from '../utils/vector.js';
import Fir from '../models/Fir.js';
import { vectorSearch } from '../utils/service.js';

export const aiRouter = Router();
let groq: Groq;
const getGroqClient = () => {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
};

const generateAnswer = async (query: any, vector_search: any, history: any[] = []) => {
  const context = vector_search.map((d: any) =>
    `FIR #${d.fir_number}: ${d.description}`
  ).join('\n')

  console.log("Context : ", context)

  const formattedHistory = history.map((h: any) => ({
    role: (h.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: h.text
  }));

  const chat = await getGroqClient().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system' as const, content:
          'You are DRISHTI, a police analytics assistant. Answer based only on the provided FIR records. Always cite FIR numbers.'
      },
      ...formattedHistory,
      {
        role: 'user' as const, content:
          `Query: ${query}\n\nRecords:\n${context}`
      }
    ]
  })
  return chat.choices[0].message.content
}


// AI #1: RAG / Conversational LLM — Chat-based FIR queries
aiRouter.post('/chat', async (req, res) => {
  const { message, history } = req.body;
  console.log(process.env.PORT)
  if (!message) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  try {
    //Convert to vector form 
    const vector = await ConvertToVector(message);

    const vector_search = await vectorSearch(vector);
    console.log("Vector : ", vector_search.map(d => d));

    const answer = await generateAnswer(message, vector_search, history);
    console.log(answer);

    const citations = vector_search.map((d: any) => ({
      id: d.fir_number,
      station: d.ps_name || '',
      type: d.crime_type || '',
      date: d.registered_date ? new Date(d.registered_date).toISOString().split('T')[0] : ''
    }));

    res.json({
      response: answer,
      citations: citations
    });
  } catch (error: any) {
    console.error("Error in /chat route: ", error);
    res.status(500).json({ error: error.message || 'An error occurred during chat processing' });
  }
});

// AI #2: OCR — Optical Character Recognition
aiRouter.post('/ocr', (req, res) => {
  res.json({
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
  });
});

// AI #3: NER — Named Entity Recognition
aiRouter.post('/ner', (req, res) => {
  const { text } = req.body;
  res.json({
    entities: [
      { text: 'Raju Kumar', category: 'PERSON', start: 22, end: 32 },
      { text: 'Shiva', category: 'PERSON', start: 50, end: 55 },
      { text: 'Koramangala flyover', category: 'LOCATION', start: 69, end: 88 },
      { text: 'KA-05-MN-4421', category: 'VEHICLE', start: 108, end: 121 },
      { text: '9876543210', category: 'PHONE', start: 139, end: 149 }
    ]
  });
});

// AI #4: Time Series Forecasting — Predict crime spikes
aiRouter.get('/forecast', (req, res) => {
  res.json({
    district: 'Bangalore East',
    forecastWindowDays: 7,
    predictions: [
      { crimeType: 'Chain Snatching', riskLevel: 'HIGH', increasePercentage: 210, peakWindow: '18:00 - 21:00', hotLocations: ['MG Road', 'Brigade Road'], confidence: 0.87 },
      { crimeType: 'Vehicle Theft', riskLevel: 'MODERATE', increasePercentage: 80, peakWindow: '23:00 - 02:00', hotLocations: ['Koramangala', 'Indiranagar'], confidence: 0.81 },
      { crimeType: 'Pickpocketing', riskLevel: 'HIGH', increasePercentage: 150, peakWindow: '12:00 - 16:00', hotLocations: ['Cubbon Park', 'Lalbagh'], confidence: 0.89 }
    ]
  });
});

// AI #5: Anomaly Detection — Catch unusual overnight surges
aiRouter.get('/anomaly', (req, res) => {
  res.json({
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
        evidenceFirs: ['FIR-5601', 'FIR-5602', 'FIR-5603'],
        confidence: 0.91,
        acknowledged: false
      }
    ]
  });
});

// AI #6: Document / Identity AI — Aadhaar, passbook, cheque scan
aiRouter.post('/document', (req, res) => {
  res.json({
    documentType: 'Bank Passbook',
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
    riskPatternFlag: 'Large cash withdrawal within 48 hours of credit. Possible hawala pattern.'
  });
});

// AI #7: Case Similarity / MO Matching — Link crimes by pattern
aiRouter.post('/similarity', (req, res) => {
  res.json({
    matches: [
      { firId: 'FIR-5698', station: 'Domlur PS', date: '3 days ago', similarityScore: 0.91, commonFactors: ['Sunday morning entry', 'Ground floor toilet window', 'No violence', 'Electronics targeted'] },
      { firId: 'FIR-5645', station: 'Marathahalli PS', date: '8 days ago', similarityScore: 0.88, commonFactors: ['Working couple home', 'Entry via terrace door', 'Morning peak hours'] }
    ]
  });
});

// AI #8: Graph / Network Analysis AI — Map criminal networks
aiRouter.get('/graph', (req, res) => {
  res.json({
    nodes: [
      { id: 'Shiva', label: 'Shiva (Accused)', type: 'PERSON', risk: 'HIGH' },
      { id: 'Ramesh Kumar', label: 'Ramesh Kumar (Co-accused)', type: 'PERSON', risk: 'MEDIUM' },
      { id: 'Ali Baig', label: 'Ali Baig (Broker)', type: 'PERSON', risk: 'HIGH' },
      { id: '9876543210', label: 'Phone: 9876543210', type: 'PHONE', risk: 'MEDIUM' },
      { id: 'KA-05-MN-4421', label: 'Vehicle: KA-05-MN-4421', type: 'VEHICLE', risk: 'MEDIUM' },
      { id: 'FIR-4521', label: 'FIR #4521', type: 'CASE', risk: 'LOW' }
    ],
    links: [
      { source: 'Shiva', target: 'Ramesh Kumar', type: 'CO_ACCUSED' },
      { source: 'Shiva', target: 'Ali Baig', type: 'SHARED_PHONE' },
      { source: 'Shiva', target: 'KA-05-MN-4421', type: 'USED_VEHICLE' },
      { source: 'Ramesh Kumar', target: 'FIR-4521', type: 'INVOLVED_IN' },
      { source: 'Ali Baig', target: '9876543210', type: 'OWNED_BY' }
    ]
  });
});

// SmartBrowz PDF export stub
aiRouter.post('/export-pdf', (req, res) => {
  res.json({
    status: 'success',
    downloadUrl: 'https://catalyst.zoho.com/smartbrowz/placeholder-briefing.pdf',
    generatedAt: new Date().toISOString()
  });
});


