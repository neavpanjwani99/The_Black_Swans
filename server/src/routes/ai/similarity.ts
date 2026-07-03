import { Router } from 'express';
import { ConvertToVector } from '../../utils/vector.js';
import { vectorSearch } from '../../utils/service.js';
import { getGroqClient } from '../../utils/groqClient.js';

export const similarityRouter = Router();

similarityRouter.post('/', async (req, res) => {
  const { firDetails } = req.body;
  if (!firDetails) {
    res.status(400).json({ error: 'firDetails is required for MO matching' });
    return;
  }

  try {
    const queryVector = await ConvertToVector(firDetails);
    const searchResults = await vectorSearch(queryVector);

    if (!searchResults || searchResults.length === 0) {
      res.json({ matches: [] });
      return;
    }

    const groqClient = getGroqClient();
    
    // For each result, ask Groq to extract common factors
    const matches = await Promise.all(searchResults.map(async (result: any) => {
      const prompt = `You are a police intelligence AI analyzing crime patterns.
Compare the following new case with a historical case to identify their Modus Operandi (MO) similarities.

New Case (Query):
"""
${firDetails}
"""

Historical Case:
"""
Crime Type: ${result.crime_type}
Description: ${result.description}
"""

List 2 to 4 very concise common factors (e.g., "Sunday morning entry", "Ground floor window", "No violence", "Similar victim profile") in a JSON array under the key "commonFactors".
Return ONLY a valid JSON object.`;

      try {
        const chat = await groqClient.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a precise AI for extracting criminal MO patterns. You output only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' }
        });

        const responseText = chat.choices[0]?.message?.content || '{"commonFactors":[]}';
        const parsed = JSON.parse(responseText);

        return {
          firId: result.fir_number,
          station: result.ps_name,
          date: result.registered_date ? new Date(result.registered_date).toISOString().split('T')[0] : 'Unknown Date',
          similarityScore: result.score || 0.85,
          commonFactors: parsed.commonFactors || []
        };
      } catch (err) {
        console.error("Groq MO Extraction Error:", err);
        return {
          firId: result.fir_number,
          station: result.ps_name,
          date: result.registered_date ? new Date(result.registered_date).toISOString().split('T')[0] : 'Unknown Date',
          similarityScore: result.score || 0.85,
          commonFactors: ["Pattern matched via semantic vector analysis"]
        };
      }
    }));

    // Filter out identical matches (score near 1.0) and sort by score
    const filteredMatches = matches
      .filter(m => m.similarityScore < 0.999) // exclude identical query
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 3); // top 3 matches

    res.json({ matches: filteredMatches });

  } catch (error: any) {
    console.error("Error in /similarity route: ", error);
    res.status(500).json({ error: error.message || 'An error occurred during MO matching' });
  }
});
