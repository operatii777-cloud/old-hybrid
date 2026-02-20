import OpenAI from 'openai';

const provider = process.env.AI_PROVIDER ?? 'openai';

export const openai = new OpenAI(
  provider === 'groq'
    ? { apiKey: process.env.GROQ_API_KEY!, baseURL: 'https://api.groq.com/openai/v1' }
    : { apiKey: process.env.OPENAI_API_KEY! }
);

export const AI_MODEL      = provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o';
export const AI_MODEL_MINI = provider === 'groq' ? 'llama-3.1-8b-instant'    : 'gpt-4o-mini';
