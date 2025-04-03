// backend/src/utils/createEmbedding.ts
import dotenv from 'dotenv';
import axios from 'axios';
import { preprocessText } from './preprocessText';
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('Environment variable OPENAI_API_KEY is not set');
}

export async function generateEmbedding(text: string): Promise<number[]> {
    const preprocessedText = preprocessText(text);
    const response = await axios.post('https://api.openai.com/v1/embeddings', {
      input: preprocessedText,
      model: 'text-embedding-ada-002'
    }, {
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
    });
    return response.data.data[0].embedding;
  }