import { Router } from 'express';
import Fir from '../../models/Fir.js';
import { getGroqClient } from '../../utils/groqClient.js';
import { ConvertToVector } from '../../utils/vector.js';
import { vectorSearch } from '../../utils/service.js';

export const graphRouter = Router();

graphRouter.get('/', async (req, res) => {
  try {
    const query = req.query.q as string;
    let recentFirs: any[] = [];

    if (query) {
      // Find cases directly related to the officer's query via text match
      const exactMatches = await Fir.find({
        $or: [
          { 'accused.name': new RegExp(query, 'i') },
          { 'description': new RegExp(query, 'i') },
          { 'fir_number': new RegExp(query, 'i') }
        ]
      }).limit(5);

      if (exactMatches.length === 0) {
        res.json({ nodes: [], links: [] });
        return;
      }

      // Fetch a few other recent cases to allow the AI to find cross-connections
      const otherFirs = await Fir.find({ _id: { $nin: exactMatches.map(f => f._id) } })
        .sort({ created_at: -1 })
        .limit(10);
      
      recentFirs = [...exactMatches, ...otherFirs];
    } else {
      // Default: Fetch recent FIRs to analyze
      recentFirs = await Fir.find().sort({ created_at: -1 }).limit(10);
    }
    
    if (recentFirs.length === 0) {
      res.json({ nodes: [], links: [] });
      return;
    }

    const firContext = recentFirs.map(f => `FIR ${f.fir_number}: ${f.description} Accused: ${f.accused.map((a: any) => a.name).join(', ')}`).join('\n\n');

    let prompt = `You are an AI intelligence analyst mapping criminal networks for police investigations.
Analyze the following recent FIR summaries and build a network graph mapping out the connections.

FIR Summaries:
${firContext}

Extract nodes and links following these rules:
1. "nodes": Array of entities. An entity can ONLY be a 'PERSON' (accused/suspect), 'PHONE' (phone number), or 'VEHICLE' (license plate).
   - DO NOT create nodes for FIR Cases or Case Numbers.
   - Each node MUST have: "id" (unique string), "label" (display text, e.g. "Shiva" or "Phone: +91..."), "type" ('PERSON', 'PHONE', 'VEHICLE'), and "risk" ('HIGH', 'MEDIUM', 'LOW').
2. "links": Array of relationships connecting nodes.
   - Each link MUST have: "source" (id of source node), "target" (id of target node), and "type" (string describing relationship, e.g. 'CO_ACCUSED', 'SHARED_PHONE', 'USED_VEHICLE').
   - You must connect People directly to Vehicles or Phones they used. Connect co-accused directly to each other.

Try to find entities (phones, vehicles, people) that appear in MULTIPLE FIRs to show the syndicate network.`;

    if (query) {
      prompt += `
CRITICAL INSTRUCTION: The investigating officer is specifically querying for: "${query}".
- You MUST completely EXCLUDE any node or person that is NOT directly or indirectly connected to "${query}".
- DO NOT create any links labeled "NOT_RELATED" or "UNRELATED". If they are not related, DO NOT include them in the JSON at all.
- The graph should ONLY show the immediate network (co-accused, shared vehicles, shared phones) of "${query}".
- Set the risk of the node representing "${query}" to 'HIGH'.
`;
    }

    prompt += `\nReturn ONLY a valid JSON object with the keys "nodes" and "links". Do not include any markdown formatting or explanations.`;

    const groqClient = getGroqClient();
    const chat = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a precise data extraction AI for criminal intelligence. You output only valid JSON. You never include unrelated data.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const resultText = chat.choices[0].message.content || '{"nodes":[], "links":[]}';
    const result = JSON.parse(resultText);

    // Filter out "NOT_RELATED" links just in case the LLM disobeys
    let filteredLinks = result.links || [];
    filteredLinks = filteredLinks.filter((l: any) => l.type !== 'NOT_RELATED' && l.type !== 'UNRELATED');

    res.json({
      nodes: result.nodes || [],
      links: filteredLinks
    });

  } catch (error: any) {
    console.error("Error in /graph route: ", error);
    res.status(500).json({ error: error.message || 'An error occurred during graph generation' });
  }
});
