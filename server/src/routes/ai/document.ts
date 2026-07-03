import { Router } from 'express';
import { getGroqClient } from '../../utils/groqClient.js';

export const documentRouter = Router();

documentRouter.post('/', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    res.status(400).json({ error: 'Text is required for document analysis' });
    return;
  }

  try {
    const groqClient = getGroqClient();
    const prompt = `You are an AI assistant specialized in analyzing Indian identity and financial documents (e.g., Bank Passbooks, Cheques, PAN cards, Aadhaar cards) for police investigations.
Analyze the following text extracted via OCR from a seized document.

Text:
"""
${text}
"""

Extract the details into a valid JSON object with the following structure:
1. "documentType": The type of document (e.g., "Bank Passbook", "Aadhaar Card", "Cheque").
2. "extractedFields": An object containing the following keys (use "N/A" if not found):
   - "bank": Name of the bank
   - "branch": Branch name
   - "accountName": Name of the account holder
   - "accountNumber": Account number
   - "ifsc": IFSC code
3. "flaggedTransactions": An array of transaction objects that look suspicious (e.g., large rapid deposits/withdrawals, hawala patterns). Each object should have:
   - "date": Date of transaction (YYYY-MM-DD)
   - "type": "CREDIT" or "DEBIT"
   - "amount": Number representing the amount
   - "sender": Counterparty name or "Cash Withdrawal" / "Unidentified"
4. "riskPatternFlag": A string describing any suspicious pattern found (e.g., "Large cash withdrawal within 48 hours of credit. Possible hawala pattern."). Return null if no suspicious pattern.

Return ONLY a valid JSON object. Do not include any markdown formatting, explanation, or backticks.`;

    const chat = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a precise data extraction AI for financial forensics. You output only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const resultText = chat.choices[0].message.content || '{}';
    const result = JSON.parse(resultText);

    res.json({
      documentType: result.documentType || 'Unknown Document',
      extractedFields: {
        bank: result.extractedFields?.bank || 'N/A',
        branch: result.extractedFields?.branch || 'N/A',
        accountName: result.extractedFields?.accountName || 'N/A',
        accountNumber: result.extractedFields?.accountNumber || 'N/A',
        ifsc: result.extractedFields?.ifsc || 'N/A'
      },
      flaggedTransactions: result.flaggedTransactions || [],
      riskPatternFlag: result.riskPatternFlag || 'No significant risk patterns detected.'
    });
  } catch (error: any) {
    console.error("Error in /document route: ", error);
    res.status(500).json({ error: error.message || 'An error occurred during document analysis' });
  }
});
