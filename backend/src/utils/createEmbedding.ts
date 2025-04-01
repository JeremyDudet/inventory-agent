import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('Environment variable OPENAI_API_KEY is not set');
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await axios.post('https://api.openai.com/v1/embeddings', {
    model: 'text-embedding-3-small',
    input: text,
  }, {
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data.data[0].embedding;
}