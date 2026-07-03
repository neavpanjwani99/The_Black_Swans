import Groq from 'groq-sdk';

let groq: Groq;
export const getGroqClient = () => {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
};
