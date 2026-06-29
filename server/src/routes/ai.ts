import Groq from 'groq-sdk';
import { Router } from 'express';
import { ConvertToVector } from '../utils/vector.js';
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
aiRouter.post('/ocr', async (req, res) => {
  const { text, confidence } = req.body;
  if (!text) {
    res.status(400).json({ error: 'Text is required for OCR analysis' });
    return;
  }

  try {
    const groqClient = getGroqClient();
    const prompt = `You are an AI assistant specialized in analyzing police FIR (First Information Report) documents.
Analyze the following text extracted via OCR from a police document.

Text:
"""
${text}
"""

Extract the following details in JSON format:
1. "language": The language of the document (e.g., "Kannada", "English", "Kannada + English (mixed)", etc.)
2. "confidence": A confidence score (number between 0 and 1) representing the quality/readability of the text. If Tesseract confidence was provided as ${confidence}, take it into account.
3. "extractedFields": An object containing:
   - "firNumber": The FIR number/ID (e.g., "0234/2019"). If not found, output null.
   - "dateFiled": The date of filing (format: YYYY-MM-DD). If not found, output null.
   - "accusedName": The name of the accused person. If not found, output null.
   - "crimeType": The crime/IPC section (e.g., "Theft under IPC 379"). If not found, output null.
   - "location": The location of the incident. If not found, output null.

Return ONLY a valid JSON object. Do not include any markdown formatting, explanation, or backticks.`;

    const chat = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a precise data extraction AI. You output only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const resultText = chat.choices[0].message.content || '{}';
    const result = JSON.parse(resultText);

    res.json({
      status: 'success',
      language: result.language || 'English',
      confidence: result.confidence || confidence || 0.9,
      extractedFields: {
        firNumber: result.extractedFields?.firNumber || 'N/A',
        dateFiled: result.extractedFields?.dateFiled || 'N/A',
        accusedName: result.extractedFields?.accusedName || 'N/A',
        crimeType: result.extractedFields?.crimeType || 'N/A',
        location: result.extractedFields?.location || 'N/A'
      },
      rawText: text
    });
  } catch (error: any) {
    console.error("Error in /ocr route: ", error);
    res.status(500).json({ error: error.message || 'An error occurred during OCR processing' });
  }
});

// AI #3: NER — Named Entity Recognition
aiRouter.post('/ner', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    res.status(400).json({ error: 'Text is required for entity recognition' });
    return;
  }

  try {
    const groqClient = getGroqClient();
    const prompt = `You are an AI assistant specialized in Named Entity Recognition (NER) for police reports.
Analyze the following text and extract entities.

Text:
"""
${text}
"""

Extract entities that belong to the following categories:
- PERSON: Names of suspects, accused, victims, or officers (e.g., "Raju Kumar", "Shiva")
- LOCATION: Names of places, roads, areas, landmark, stations (e.g., "Koramangala flyover", "Near Bus Stand, Gulbarga")
- VEHICLE: Vehicle registration numbers, license plates, or specific vehicle models mentioned with numbers (e.g., "KA-05-MN-4421")
- PHONE: Phone numbers, mobile numbers (e.g., "9876543210")
- DATE: Dates (e.g., "14th January", "2019-03-14")

Return a JSON object containing a single key "entities", which is an array of objects. Each object must have:
- "text": The exact text of the entity as it appears in the input text.
- "category": One of "PERSON", "LOCATION", "VEHICLE", "PHONE", "DATE".

Return ONLY a valid JSON object. Do not include any markdown formatting, explanation, or backticks.`;

    const chat = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a precise NER extraction AI. You output only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const resultText = chat.choices[0].message.content || '{"entities": []}';
    const result = JSON.parse(resultText);
    const rawEntities = result.entities || [];

    // Map entities and compute their start/end indices programmatically to ensure correctness
    const matched = new Array(text.length).fill(false);
    const entitiesWithIndices: any[] = [];

    // Sort by length descending to match longer entities first (e.g., "Raju Kumar" before "Raju")
    const sortedEntities = [...rawEntities].sort((a: any, b: any) => b.text.length - a.text.length);

    for (const entity of sortedEntities) {
      if (!entity.text || !entity.category) continue;
      let pos = 0;
      while (true) {
        pos = text.toLowerCase().indexOf(entity.text.toLowerCase(), pos);
        if (pos === -1) break;

        const start = pos;
        const end = pos + entity.text.length;

        // Check if there is an overlap
        let overlap = false;
        for (let i = start; i < end; i++) {
          if (matched[i]) {
            overlap = true;
            break;
          }
        }

        if (!overlap) {
          for (let i = start; i < end; i++) {
            matched[i] = true;
          }
          entitiesWithIndices.push({
            text: text.substring(start, end),
            category: entity.category.toUpperCase(),
            start,
            end
          });
        }
        pos = end;
      }
    }

    // Sort by start index
    entitiesWithIndices.sort((a, b) => a.start - b.start);

    res.json({
      entities: entitiesWithIndices
    });
  } catch (error: any) {
    console.error("Error in /ner route: ", error);
    res.status(500).json({ error: error.message || 'An error occurred during NER' });
  }
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


