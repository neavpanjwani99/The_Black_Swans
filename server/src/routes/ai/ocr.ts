import { Router } from 'express';
import { getGroqClient } from '../../utils/groqClient.js';

export const ocrRouter = Router();

ocrRouter.post('/', async (req, res) => {
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

Extract the following details in JSON format perfectly structured for our database:
1. "language": The language of the document (e.g., "Kannada", "English", "Kannada + English (mixed)")
2. "confidence": A confidence score (number between 0 and 1) representing the quality/readability of the text. If Tesseract confidence was provided as ${confidence}, take it into account.
3. "extractedFields": An object containing:
   - "fir_number": The FIR number/ID (e.g., "0234/2019"). If not found, output null.
   - "ps_name": The Police Station name. If not found, output null.
   - "district": The district name. If not found, output null.
   - "incident_date": The date of the incident (format: YYYY-MM-DD). If not found, output null.
   - "registered_date": The date of filing (format: YYYY-MM-DD). If not found, output null.
   - "crime_type": The crime type/IPC section description (e.g., "Theft"). If not found, output null.
   - "ipc_sections": Array of IPC sections (e.g., ["379"]). If none found, output [].
   - "description": A concise summary of the incident/complaint.
   - "accused": Array of objects, each containing: "name", "age", "gender" (Male/Female/Other), "address". If not found, output [].
   - "victim": Array of objects, each containing: "name", "age", "gender". If not found, output [].
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

    console.log("OCR Result: ", result);

    res.json({
      status: 'success',
      message: 'OCR Extraction Complete',
      language: result.language || 'English',
      confidence: result.confidence || confidence || 0.9,
      extractedFields: result.extractedFields || {},
      rawText: text
    });
  } catch (error: any) {
    console.error("Error in /ocr route: ", error);
    res.status(500).json({ error: error.message || 'An error occurred during OCR processing' });
  }
});
