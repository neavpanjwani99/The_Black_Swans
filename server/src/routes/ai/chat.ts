import { Router } from 'express';
import { ConvertToVector } from '../../utils/vector.js';
import { vectorSearch } from '../../utils/service.js';
import { getGroqClient } from '../../utils/groqClient.js';

export const chatRouter = Router();

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

chatRouter.post('/', async (req, res) => {
  const { message, history } = req.body;
  console.log(process.env.PORT)
  if (!message) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  try {
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
