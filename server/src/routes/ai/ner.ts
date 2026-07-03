import { Router } from 'express';
import { getGroqClient } from '../../utils/groqClient.js';

export const nerRouter = Router();

nerRouter.post('/', async (req, res) => {
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

    const matched = new Array(text.length).fill(false);
    const entitiesWithIndices: any[] = [];

    const sortedEntities = [...rawEntities].sort((a: any, b: any) => b.text.length - a.text.length);

    for (const entity of sortedEntities) {
      if (!entity.text || !entity.category) continue;
      let pos = 0;
      while (true) {
        pos = text.toLowerCase().indexOf(entity.text.toLowerCase(), pos);
        if (pos === -1) break;

        const start = pos;
        const end = pos + entity.text.length;

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

    entitiesWithIndices.sort((a, b) => a.start - b.start);

    res.json({
      entities: entitiesWithIndices
    });
  } catch (error: any) {
    console.error("Error in /ner route: ", error);
    res.status(500).json({ error: error.message || 'An error occurred during NER' });
  }
});
